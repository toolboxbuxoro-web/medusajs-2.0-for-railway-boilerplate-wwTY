import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

/**
 * Automatically completes orders when payment is captured and fulfillment is done.
 * 
 * This subscriber listens to payment and fulfillment events and checks if
 * the order can be marked as "completed". An order is considered ready to
 * complete when:
 * - payment_status is "captured" (or "authorized" in some flows)
 * - fulfillment_status is "fulfilled" or "shipped" (or "delivered" in some flows)
 */
export default async function autoCompleteOrder({
  event: { data, name },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger")
  const orderModule: IOrderModuleService = container.resolve(Modules.ORDER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Extract order ID from event data
  // Different events may have different structures
  let orderId: string | undefined

  if (data.order_id) {
    orderId = data.order_id
  } else if (data.id && typeof data.id === "string" && data.id.startsWith("order_")) {
    orderId = data.id
  } else if (data.order?.id) {
    orderId = data.order.id
  } else if (name?.includes("order") && data.id) {
    orderId = data.id
  }

  if (!orderId) {
    logger.debug(`[auto-complete-order] No order ID found in event ${name}, skipping. Event data: ${JSON.stringify(data)}`)
    return
  }

  // For order.placed events, add a small delay to allow payment/fulfillment statuses to be set
  if (name === "order.placed") {
    // Wait 2 seconds to allow payment and fulfillment workflows to complete
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  try {
    // Use query.graph to get order with payment_status and fulfillment_status
    // These fields are available in the graph but not in the typed OrderDTO
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "status", "payment_status", "fulfillment_status"],
      filters: { id: orderId },
    })

    const order = orders?.[0] as any

    if (!order) {
      logger.warn(`[auto-complete-order] Order ${orderId} not found`)
      return
    }

    // Skip if already completed
    if (order.status === "completed") {
      logger.debug(`[auto-complete-order] Order ${orderId} already completed, skipping`)
      return
    }

    // Check payment status
    // Accept both "captured" and "authorized" (some payment providers use authorized)
    const paymentStatus = order.payment_status || null
    const paymentOk =
      paymentStatus === "captured" ||
      paymentStatus === "authorized" ||
      paymentStatus === "paid"

    // Check fulfillment status
    // Accept "fulfilled", "shipped", or "delivered" (some flows use delivered)
    const fulfillmentStatus = order.fulfillment_status || null
    const fulfillmentOk =
      fulfillmentStatus === "fulfilled" ||
      fulfillmentStatus === "shipped" ||
      fulfillmentStatus === "delivered"

    // Complete if both are OK, OR if payment is OK and fulfillment is null (digital goods)
    // OR if fulfillment is delivered and payment is authorized/captured/null
    const canComplete = (paymentOk && fulfillmentOk) ||
                        (paymentOk && fulfillmentStatus === null) ||
                        (fulfillmentOk && (paymentOk || paymentStatus === null))

    logger.info(
      `[auto-complete-order] Order ${orderId} [event: ${name}]: payment=${paymentStatus || 'null'} (${paymentOk}), fulfillment=${fulfillmentStatus || 'null'} (${fulfillmentOk}), current_status=${order.status}, canComplete=${canComplete}`
    )

    // If conditions are met, complete the order
    if (canComplete) {
      try {
        // Double-check status to avoid race conditions (another subscriber might have completed it)
        const currentOrder = await orderModule.retrieveOrder(orderId)
        if (currentOrder.status === "completed") {
          logger.debug(`[auto-complete-order] Order ${orderId} already completed by another process, skipping`)
          return
        }

        // In Medusa 2.0, updateOrders expects an array of order updates
        await orderModule.updateOrders([{
          id: orderId,
          status: "completed",
        }])
        logger.info(`[auto-complete-order] ✅ Successfully completed order ${orderId}`)
      } catch (completeError: any) {
        logger.error(
          `[auto-complete-order] ❌ Failed to complete order ${orderId}: ${completeError.message || completeError}`
        )
        if (completeError.stack) {
          logger.error(`[auto-complete-order] Stack: ${completeError.stack}`)
        }
      }
    } else {
      logger.debug(
        `[auto-complete-order] Order ${orderId} not ready: payment=${paymentOk}, fulfillment=${fulfillmentOk}`
      )
    }
  } catch (error: any) {
    logger.error(
      `[auto-complete-order] Error processing order ${orderId}: ${error.message || error}`
    )
    if (error.stack) {
      logger.error(`[auto-complete-order] Stack: ${error.stack}`)
    }
    logger.debug(`[auto-complete-order] Event: ${name}, Data: ${JSON.stringify(data)}`)
  }
}

export const config: SubscriberConfig = {
  event: [
    // Payment events
    "payment.captured",
    "payment.authorized",
    "payment_collection.payment_authorized",
    // Fulfillment events
    "fulfillment.shipped",
    "fulfillment.created",
    "fulfillment.fulfilled",
    // Order events (in case status changes trigger this)
    "order.payment_captured",
    "order.fulfillment_created",
    "order.updated",
    // Also listen to order.placed to check initial state
    "order.placed",
  ],
}
