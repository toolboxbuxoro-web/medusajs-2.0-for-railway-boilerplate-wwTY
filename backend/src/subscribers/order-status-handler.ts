import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

/**
 * Order Status Handler - Medusa 2.0 Compliant (Debug Version)
 * 
 * Extensive logging to diagnose why payment_status/fulfillment_status are undefined
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

  logger.info(`[order-status] ========== Processing ${name} for order ${orderId} ==========`)

  // For order.placed, wait a bit to allow initial workflows to complete
  if (name === "order.placed") {
    logger.info(`[order-status] Waiting 5 seconds for workflows to complete...`)
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  try {
    // METHOD 1: Try orderModule.retrieveOrder
    logger.info(`[order-status] METHOD 1: Using orderModule.retrieveOrder()`)
    const orderResult = await orderModule.retrieveOrder(orderId)
    const order = orderResult as any
    
    logger.info(`[order-status] Order basic info:`)
    logger.info(`  - id: ${order.id}`)
    logger.info(`  - status: ${order.status}`)
    logger.info(`  - display_id: ${order.display_id}`)
    
    logger.info(`[order-status] Order computed fields (may be undefined):`)
    logger.info(`  - payment_status: ${order.payment_status}`)
    logger.info(`  - fulfillment_status: ${order.fulfillment_status}`)
    
    logger.info(`[order-status] ALL order keys: ${Object.keys(order).join(', ')}`)

    if (order.status === "completed") {
      logger.info(`[order-status] Order already completed, stopping`)
      return
    }

    // METHOD 2: Try query.graph with relations
    logger.info(`[order-status] METHOD 2: Using query.graph with relations`)
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "status",
        "payment_status",
        "fulfillment_status",
        "payment_collections.*",
        "fulfillments.*",
      ],
      filters: { id: orderId },
    })

    const graphOrder = orders?.[0] as any
    
    if (graphOrder) {
      logger.info(`[order-status] query.graph results:`)
      logger.info(`  - payment_status: ${graphOrder.payment_status}`)
      logger.info(`  - fulfillment_status: ${graphOrder.fulfillment_status}`)
      logger.info(`  - payment_collections count: ${graphOrder.payment_collections?.length || 0}`)
      logger.info(`  - fulfillments count: ${graphOrder.fulfillments?.length || 0}`)
      
      if (graphOrder.payment_collections?.length > 0) {
        graphOrder.payment_collections.forEach((pc: any, i: number) => {
          logger.info(`  - payment_collection[${i}].status: ${pc.status}`)
          logger.info(`  - payment_collection[${i}].authorized_amount: ${pc.authorized_amount}`)
          logger.info(`  - payment_collection[${i}].captured_amount: ${pc.captured_amount}`)
        })
      }
      
      if (graphOrder.fulfillments?.length > 0) {
        graphOrder.fulfillments.forEach((f: any, i: number) => {
          logger.info(`  - fulfillment[${i}].id: ${f.id}`)
          logger.info(`  - fulfillment[${i}].shipped_at: ${f.shipped_at}`)
          logger.info(`  - fulfillment[${i}].delivered_at: ${f.delivered_at}`)
          logger.info(`  - fulfillment[${i}] keys: ${Object.keys(f).join(', ')}`)
        })
      }
    }

    // METHOD 3: Manual check logic
    logger.info(`[order-status] METHOD 3: Manual status determination`)
    
    let paymentCaptured = false
    let fulfillmentDelivered = false
    
    // Check if we have captured payment
    if (graphOrder?.payment_collections?.length > 0) {
      const pc = graphOrder.payment_collections[0]
      paymentCaptured = pc.status === "captured" || (pc.captured_amount > 0)
      logger.info(`  - Payment captured check: ${paymentCaptured} (status=${pc.status}, captured=${pc.captured_amount})`)
    }
    
    // Check if we have delivered fulfillment
    if (graphOrder?.fulfillments?.length > 0) {
      const f = graphOrder.fulfillments[0]
      fulfillmentDelivered = !!f.delivered_at
      logger.info(`  - Fulfillment delivered check: ${fulfillmentDelivered} (delivered_at=${f.delivered_at})`)
    }
    
    logger.info(`[order-status] DECISION: payment=${paymentCaptured}, fulfillment=${fulfillmentDelivered}`)
    
    if (paymentCaptured && fulfillmentDelivered) {
      logger.info(`[order-status] ✅ Conditions met! Completing order...`)
      
      // Double-check to avoid race conditions
      const currentOrder = await orderModule.retrieveOrder(orderId)
      if (currentOrder.status === "completed") {
        logger.info(`[order-status] Order already completed by another process`)
        return
      }

      await orderModule.updateOrders([{
        id: orderId,
        status: "completed",
      }])

      logger.info(`[order-status] ✅✅✅ Successfully completed order ${orderId}`)
    } else {
      logger.info(`[order-status] ⏸️ Not ready - waiting for: ${!paymentCaptured ? 'payment ' : ''}${!fulfillmentDelivered ? 'fulfillment' : ''}`)
    }

  } catch (error: any) {
    logger.error(`[order-status] ❌ ERROR: ${error.message}`)
    logger.error(`[order-status] Stack: ${error.stack}`)
  }
  
  logger.info(`[order-status] ========== END ${orderId} ==========`)
}

export const config: SubscriberConfig = {
  event: [
    "fulfillment.delivered",
    "payment.captured",
    "order.payment_captured",
    "order.updated",
    "order.placed",
  ],
}
