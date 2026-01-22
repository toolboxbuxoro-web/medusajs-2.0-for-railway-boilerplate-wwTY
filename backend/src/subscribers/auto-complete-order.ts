import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"
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
    logger.debug(`[auto-complete-order] No order ID found in event ${name}, skipping`)
    return
  }

  try {
    // Retrieve the order with current status
    const order = await orderModule.retrieveOrder(orderId, {
      relations: ["payment_collections", "fulfillments"],
    })

    const orderAny = order as any

    // Skip if already completed
    if (order.status === "completed") {
      logger.debug(`[auto-complete-order] Order ${orderId} already completed, skipping`)
      return
    }

    // Check payment status
    // Accept both "captured" and "authorized" (some payment providers use authorized)
    const paymentStatus = orderAny.payment_status || order.payment_collections?.[0]?.status
    const paymentOk =
      paymentStatus === "captured" ||
      paymentStatus === "authorized" ||
      paymentStatus === "paid"

    // Check fulfillment status
    // Accept "fulfilled", "shipped", or "delivered" (some flows use delivered)
    const fulfillmentStatus = orderAny.fulfillment_status || order.fulfillments?.[0]?.status
    const fulfillmentOk =
      fulfillmentStatus === "fulfilled" ||
      fulfillmentStatus === "shipped" ||
      fulfillmentStatus === "delivered"

    logger.info(
      `[auto-complete-order] Order ${orderId}: payment=${paymentStatus} (${paymentOk}), fulfillment=${fulfillmentStatus} (${fulfillmentOk}), current_status=${order.status}`
    )

    // If both conditions are met, complete the order
    if (paymentOk && fulfillmentOk) {
      try {
        // In Medusa 2.0, we update the order status directly
        await orderModule.updateOrders(orderId, {
          status: "completed",
        })
        logger.info(`[auto-complete-order] ✅ Successfully completed order ${orderId}`)
      } catch (completeError: any) {
        logger.error(
          `[auto-complete-order] ❌ Failed to complete order ${orderId}: ${completeError.message}`
        )
      }
    } else {
      logger.debug(
        `[auto-complete-order] Order ${orderId} not ready: payment=${paymentOk}, fulfillment=${fulfillmentOk}`
      )
    }
  } catch (error: any) {
    logger.error(
      `[auto-complete-order] Error processing order ${orderId}: ${error.message}`
    )
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
