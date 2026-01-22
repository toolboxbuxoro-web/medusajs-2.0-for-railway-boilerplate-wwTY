import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

/**
 * Order Status Handler - Medusa 2.0 Compliant
 * 
 * Automatically completes orders when BOTH conditions are met:
 * 1. payment_status = "captured"
 * 2. fulfillment_status = "delivered"
 * 
 * Note: Uses direct SQL for status checks as computed fields are not reliably 
 * returned by module methods during background event processing.
 */
export default async function orderStatusHandler({
  event: { data, name },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger")
  const orderModule: IOrderModuleService = container.resolve(Modules.ORDER)
  const pgConnection = container.resolve("__pg_connection__")

  let orderId: string | undefined

  // 1. Extract order ID from various event structures
  if (data.order_id) {
    orderId = data.order_id
  } else if (data.id && typeof data.id === "string" && data.id.startsWith("order_")) {
    orderId = data.id
  } else if (data.order?.id) {
    orderId = data.order.id
  } else if (data.fulfillment?.order_id) {
    orderId = data.fulfillment.order_id
  } 
  // Handle fulfillment/delivery/shipment events where only fulfillment ID is provided
  else if (data.id && typeof data.id === "string" && (data.id.startsWith("ful_"))) {
    try {
      // In Medusa 2.0, fulfillment -> order relationship is through order_fulfillment link table
      const linkResult = await pgConnection.raw(`
        SELECT order_id 
        FROM order_fulfillment
        WHERE fulfillment_id = ?
        LIMIT 1
      `, [data.id])
      
      if (linkResult?.rows?.[0]?.order_id) {
        orderId = linkResult.rows[0].order_id
      }
    } catch (e: any) {
      logger.error(`[order-status] Failed to lookup order from fulfillment ${data.id}: ${e.message}`)
    }
  }

  if (!orderId) {
    logger.debug(`[order-status] Could not find order ID for event ${name}`)
    return
  }

  logger.info(`[order-status] Processing ${name} for order ${orderId}`)

  // For order.placed, wait a bit to allow initial workflows (like payment capture) to complete
  if (name === "order.placed") {
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  try {
    // Check order status first - skip if already completed
    const order = await orderModule.retrieveOrder(orderId)
    if (!order || order.status === "completed") {
      return
    }

    // 2. Check Payment Status via SQL
    // In Medusa 2.0, an order is 'captured' if the associated payment_collection is captured
    const paymentResult = await pgConnection.raw(`
      SELECT pc.status, pc.captured_amount
      FROM payment_collection pc
      JOIN order_payment_collection opc ON pc.id = opc.payment_collection_id
      WHERE opc.order_id = ?
      LIMIT 1
    `, [orderId])

    const pc = paymentResult?.rows?.[0]
    const isCaptured = pc && (pc.status === 'completed' || pc.status === 'captured' || Number(pc.captured_amount) > 0)

    // 3. Check Fulfillment Status via SQL
    // An order is 'delivered' if all fulfillments associated with it are delivered
    const fulfillmentResult = await pgConnection.raw(`
      SELECT f.id, f.delivered_at
      FROM fulfillment f
      JOIN order_fulfillment of ON f.id = of.fulfillment_id
      WHERE of.order_id = ?
    `, [orderId])

    const fulfillments = fulfillmentResult?.rows || []
    // If no fulfillments yet, it's definitely not delivered
    const isDelivered = fulfillments.length > 0 && fulfillments.every((f: any) => f.delivered_at !== null)

    logger.info(`[order-status] Order ${orderId} status check: payment_captured=${isCaptured}, items_delivered=${isDelivered}`)

    if (isCaptured && isDelivered) {
      // Complete the order
      await orderModule.updateOrders([{
        id: orderId,
        status: "completed",
      }])

      logger.info(`[order-status] ✅ Order ${orderId} marked as COMPLETED`)
    }
  } catch (error: any) {
    logger.error(`[order-status] Error processing order ${orderId}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: [
    "delivery.created",
    "shipment.created",
    "payment.captured",
    "order.payment_captured",
    "order.updated",
    "order.placed",
  ],
}
