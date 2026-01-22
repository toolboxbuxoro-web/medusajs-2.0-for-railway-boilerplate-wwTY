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

  // For order.placed events, add a delay to allow payment/fulfillment statuses to be set
  if (name === "order.placed") {
    // Wait 5 seconds to allow payment and fulfillment workflows to complete
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  // Helper function to check and complete order
  const checkAndCompleteOrder = async (attempt: number = 1): Promise<boolean> => {
    try {
      // Get order with payment_collections and fulfillments to check actual statuses
      // In Medusa 2.0, payment_status and fulfillment_status are computed from related entities
      const { data: orders } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "status",
          "payment_status",
          "fulfillment_status",
          "payment_collections.id",
          "payment_collections.status",
          "payment_collections.payment_sessions.id",
          "payment_collections.payment_sessions.status",
          "payment_collections.payment_sessions.data",
          "fulfillments.id",
          "fulfillments.status",
        ],
        filters: { id: orderId },
      })

      const order = orders?.[0] as any

      if (!order) {
        logger.warn(`[auto-complete-order] Order ${orderId} not found`)
        return false
      }

      // Skip if already completed
      if (order.status === "completed") {
        logger.debug(`[auto-complete-order] Order ${orderId} already completed, skipping`)
        return true
      }

      // Check payment status from multiple sources
      // In Medusa 2.0, payment_status is computed from payment_collections
      // 1. Direct payment_status field (computed by Medusa)
      // 2. payment_collections status
      // 3. payment_sessions status and data (for Payme/Click custom states)
      let paymentStatus = order.payment_status || null
      
      // If payment_status is null, check payment_collections directly
      if (!paymentStatus || paymentStatus === "not_paid") {
        if (order.payment_collections?.[0]) {
          const paymentCollection = order.payment_collections[0]
          paymentStatus = paymentCollection.status || null
          
          // If collection status not set, check payment sessions
          if ((!paymentStatus || paymentStatus === "not_paid") && paymentCollection.payment_sessions?.[0]) {
            const session = paymentCollection.payment_sessions[0]
            paymentStatus = session.status || null
            
            // For Payme/Click, check session data for payment state
            // Payme: payme_state=2 means authorized/paid
            // Click: click_state="paid" means paid
            if (session.data) {
              const sessionData = typeof session.data === 'string' ? JSON.parse(session.data) : session.data
              if (sessionData.payme_state === 2) {
                paymentStatus = "authorized" // Payme state 2 = transaction performed (paid)
              } else if (sessionData.click_state === "paid") {
                paymentStatus = "authorized" // Click paid state
              }
            }
          }
        }
      }

      const paymentOk =
        paymentStatus === "captured" ||
        paymentStatus === "authorized" ||
        paymentStatus === "paid"

      // Check fulfillment status from multiple sources
      // 1. Direct fulfillment_status field (if available)
      // 2. fulfillments status
      let fulfillmentStatus = order.fulfillment_status || null
      
      if (!fulfillmentStatus && order.fulfillments?.[0]) {
        fulfillmentStatus = order.fulfillments[0].status || null
      }

      const fulfillmentOk =
        fulfillmentStatus === "fulfilled" ||
        fulfillmentStatus === "shipped" ||
        fulfillmentStatus === "delivered"

      // Complete if:
      // 1. Both payment and fulfillment are OK
      // 2. Payment is OK and fulfillment is null/not used (common for digital goods or stores without fulfillment tracking)
      // 3. Fulfillment is delivered and payment is OK or null (for manual payment flows)
      // 
      // IMPORTANT: In your flow, if payment is successful (authorized/captured), we complete the order
      // even if fulfillment_status is null, because fulfillment might not be tracked in your system
      const canComplete = (paymentOk && fulfillmentOk) ||
                          (paymentOk && (fulfillmentStatus === null || !order.fulfillments || order.fulfillments.length === 0)) ||
                          (fulfillmentOk && (paymentOk || paymentStatus === null))

      // Detailed logging for debugging
      logger.info(
        `[auto-complete-order] Order ${orderId} [event: ${name}, attempt: ${attempt}]: payment=${paymentStatus || 'null'} (${paymentOk}), fulfillment=${fulfillmentStatus || 'null'} (${fulfillmentOk}), current_status=${order.status}, canComplete=${canComplete}`
      )
      
      // Debug: log what we got from query
      if (attempt === 1 && name === "order.placed") {
        logger.debug(
          `[auto-complete-order] DEBUG Order ${orderId} query result: payment_collections=${order.payment_collections?.length || 0}, fulfillments=${order.fulfillments?.length || 0}, payment_status=${order.payment_status || 'null'}, fulfillment_status=${order.fulfillment_status || 'null'}`
        )
        if (order.payment_collections?.[0]?.payment_sessions?.[0]?.data) {
          const sessionData = order.payment_collections[0].payment_sessions[0].data
          logger.debug(
            `[auto-complete-order] DEBUG Payment session data: ${JSON.stringify(typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData)}`
          )
        }
      }

      // If conditions are met, complete the order
      if (canComplete) {
        try {
          // Double-check status to avoid race conditions (another subscriber might have completed it)
          const currentOrder = await orderModule.retrieveOrder(orderId)
          if (currentOrder.status === "completed") {
            logger.debug(`[auto-complete-order] Order ${orderId} already completed by another process, skipping`)
            return true
          }

          // In Medusa 2.0, updateOrders expects an array of order updates
          await orderModule.updateOrders([{
            id: orderId,
            status: "completed",
          }])
          logger.info(`[auto-complete-order] ✅ Successfully completed order ${orderId}`)
          return true
        } catch (completeError: any) {
          logger.error(
            `[auto-complete-order] ❌ Failed to complete order ${orderId}: ${completeError.message || completeError}`
          )
          if (completeError.stack) {
            logger.error(`[auto-complete-order] Stack: ${completeError.stack}`)
          }
          return false
        }
      } else {
        // If statuses are still null and this is order.placed event, retry after delay
        if (name === "order.placed" && paymentStatus === null && fulfillmentStatus === null && attempt < 3) {
          logger.debug(
            `[auto-complete-order] Order ${orderId} statuses still null, retrying in 5 seconds (attempt ${attempt + 1}/3)`
          )
          await new Promise(resolve => setTimeout(resolve, 5000))
          return await checkAndCompleteOrder(attempt + 1)
        }
        
        logger.debug(
          `[auto-complete-order] Order ${orderId} not ready: payment=${paymentOk}, fulfillment=${fulfillmentOk}`
        )
        return false
      }
    } catch (error: any) {
      logger.error(
        `[auto-complete-order] Error checking order ${orderId} (attempt ${attempt}): ${error.message || error}`
      )
      return false
    }
  }

  try {
    const completed = await checkAndCompleteOrder()
    if (!completed && name === "order.placed") {
      logger.info(
        `[auto-complete-order] Order ${orderId} not completed yet, will be checked by complete-ready-orders script or on next status update`
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
