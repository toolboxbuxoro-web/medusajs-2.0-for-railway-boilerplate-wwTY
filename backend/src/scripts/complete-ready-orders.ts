import { ExecArgs } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

/**
 * Script to check and complete orders that are ready (payment + fulfillment done)
 * but still in pending status.
 * 
 * This is a fallback mechanism in case the auto-complete subscriber doesn't catch
 * all cases due to event timing or missing events.
 * 
 * Run: medusa run script complete-ready-orders
 */
export default async function completeReadyOrders({
  container,
}: ExecArgs) {
  const logger = container.resolve("logger")
  const orderModule: IOrderModuleService = container.resolve(Modules.ORDER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("[complete-ready-orders] Starting check for ready orders...")

  try {
    // Find all pending orders
    const { data: pendingOrders } = await query.graph({
      entity: "order",
      fields: ["id", "status", "payment_status", "fulfillment_status"],
      filters: {
        status: "pending",
      },
      pagination: {
        take: 100, // Process in batches
      },
    })

    logger.info(`[complete-ready-orders] Found ${pendingOrders?.length || 0} pending orders`)

    if (!pendingOrders || pendingOrders.length === 0) {
      logger.info("[complete-ready-orders] No pending orders found")
      return
    }

    let completedCount = 0
    let skippedCount = 0

    for (const order of pendingOrders) {
      const orderAny = order as any
      const orderId = orderAny.id

      // Check payment status
      const paymentStatus = orderAny.payment_status || null
      const paymentOk =
        paymentStatus === "captured" ||
        paymentStatus === "authorized" ||
        paymentStatus === "paid"

      // Check fulfillment status
      const fulfillmentStatus = orderAny.fulfillment_status || null
      const fulfillmentOk =
        fulfillmentStatus === "fulfilled" ||
        fulfillmentStatus === "shipped" ||
        fulfillmentStatus === "delivered"

      // Complete if both are OK, OR if payment is OK and fulfillment is null
      const canComplete = (paymentOk && fulfillmentOk) ||
                          (paymentOk && fulfillmentStatus === null) ||
                          (fulfillmentOk && (paymentOk || paymentStatus === null))

      if (canComplete) {
        try {
          // Double-check current status
          const currentOrder = await orderModule.retrieveOrder(orderId)
          if (currentOrder.status === "completed") {
            logger.debug(`[complete-ready-orders] Order ${orderId} already completed, skipping`)
            skippedCount++
            continue
          }

          await orderModule.updateOrders([{
            id: orderId,
            status: "completed",
          }])

          logger.info(
            `[complete-ready-orders] ✅ Completed order ${orderId} (payment=${paymentStatus}, fulfillment=${fulfillmentStatus})`
          )
          completedCount++
        } catch (error: any) {
          logger.error(
            `[complete-ready-orders] ❌ Failed to complete order ${orderId}: ${error.message || error}`
          )
        }
      } else {
        logger.debug(
          `[complete-ready-orders] Order ${orderId} not ready: payment=${paymentStatus || 'null'} (${paymentOk}), fulfillment=${fulfillmentStatus || 'null'} (${fulfillmentOk})`
        )
        skippedCount++
      }
    }

    logger.info(
      `[complete-ready-orders] ✅ Completed: ${completedCount}, Skipped: ${skippedCount}, Total: ${pendingOrders.length}`
    )
  } catch (error: any) {
    logger.error(`[complete-ready-orders] Error: ${error.message || error}`)
    if (error.stack) {
      logger.error(`[complete-ready-orders] Stack: ${error.stack}`)
    }
    throw error
  }
}
