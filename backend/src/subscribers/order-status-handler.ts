import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

/**
 * Order Status Handler - Medusa 2.0 Compliant
 * 
 * Automatically completes orders when BOTH conditions are met:
 * 1. payment_status = "captured"
 * 2. fulfillment_status = "delivered"
 * 
 * This follows Medusa 2.0 best practices:
 * - Uses query.graph instead of raw SQL
 * - Listens to fulfillment.delivered event (not payment events)
 * - Checks both payment and fulfillment status before completing
 */
export default async function orderStatusHandler({
  event: { data, name },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger")
  const orderModule: IOrderModuleService = container.resolve(Modules.ORDER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Extract order ID from event data
  let orderId: string | undefined

  if (data.order_id) {
    orderId = data.order_id
  } else if (data.id && typeof data.id === "string" && data.id.startsWith("order_")) {
    orderId = data.id
  } else if (data.order?.id) {
    orderId = data.order.id
  }

  if (!orderId) {
    logger.debug(`[order-status] No order ID in event ${name}, skipping`)
    return
  }

  logger.info(`[order-status] Processing ${name} for order ${orderId}`)

  try {
    // Get order with payment and fulfillment status using Medusa API
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "status",
        "payment_status",
        "fulfillment_status",
      ],
      filters: { id: orderId },
    })

    const order = orders?.[0] as any

    if (!order) {
      logger.warn(`[order-status] Order ${orderId} not found`)
      return
    }

    // Already completed - skip
    if (order.status === "completed") {
      logger.debug(`[order-status] Order ${orderId} already completed`)
      return
    }

    // Check if order should be completed
    // Medusa 2.0: Complete only when payment is captured AND fulfillment is delivered
    const paymentCaptured = order.payment_status === "captured"
    const fulfillmentDelivered = order.fulfillment_status === "delivered"

    logger.info(
      `[order-status] Order ${orderId}: payment=${order.payment_status} (${paymentCaptured}), fulfillment=${order.fulfillment_status} (${fulfillmentDelivered})`
    )

    if (paymentCaptured && fulfillmentDelivered) {
      // Double-check to avoid race conditions
      const currentOrder = await orderModule.retrieveOrder(orderId)
      if (currentOrder.status === "completed") {
        logger.debug(`[order-status] Order ${orderId} already completed by another process`)
        return
      }

      // Complete the order
      await orderModule.updateOrders([{
        id: orderId,
        status: "completed",
      }])

      logger.info(`[order-status] ✅ Completed order ${orderId}`)
    } else {
      logger.debug(`[order-status] Order ${orderId} not ready: payment=${paymentCaptured}, fulfillment=${fulfillmentDelivered}`)
    }

  } catch (error: any) {
    logger.error(`[order-status] Error processing order ${orderId}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: [
    // Fulfillment events - primary trigger for order completion
    "fulfillment.delivered",
    // Payment events - in case fulfillment was already delivered
    "payment.captured",
    "order.payment_captured",
    // Order update - catch-all for any status changes
    "order.updated",
  ],
}
