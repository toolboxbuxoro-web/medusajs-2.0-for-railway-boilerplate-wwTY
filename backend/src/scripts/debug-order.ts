import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Debug script to check order status details.
 * Run: medusa run script debug-order --args id=order_...
 */
export default async function debugOrder({ container, args }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  
  const orderId = args?.[0] || "order_01KFJ2ZT9139S0F42ZRREG3RMX" // Default to the problematic order

  logger.info(`[debug-order] Checking order ${orderId}...`)

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "status",
        "payment_status",
        "fulfillment_status",
        "payment_collections.status",
        "payment_collections.payment_sessions.status",
        "payment_collections.payment_sessions.data",
        "fulfillments.status",
        "fulfillments.created_at",
      ],
      filters: { id: orderId },
    })

    const order = orders?.[0] as any

    if (!order) {
      logger.error(`[debug-order] Order not found!`)
      return
    }

    logger.info(`[debug-order] ----------------------------------------`)
    logger.info(`[debug-order] ID: ${order.id}`)
    logger.info(`[debug-order] Status: ${order.status}`)
    logger.info(`[debug-order] Payment Status: ${order.payment_status}`)
    logger.info(`[debug-order] Fulfillment Status: ${order.fulfillment_status}`)
    logger.info(`[debug-order] ----------------------------------------`)
    
    logger.info(`[debug-order] Payment Collections:`)
    if (order.payment_collections) {
      order.payment_collections.forEach((pc: any, i: number) => {
        logger.info(`  [${i}] Status: ${pc.status}`)
        if (pc.payment_sessions) {
           pc.payment_sessions.forEach((ps: any, j: number) => {
             logger.info(`    Session [${j}] Status: ${ps.status}`)
             logger.info(`    Session [${j}] Data: ${JSON.stringify(ps.data)}`)
           })
        }
      })
    }

    logger.info(`[debug-order] Fulfillments:`)
    if (order.fulfillments) {
      order.fulfillments.forEach((f: any, i: number) => {
        logger.info(`  [${i}] Status: ${f.status || 'N/A'}`)
        logger.info(`  [${i}] Created: ${f.created_at}`)
      })
    }
    
    const paymentCaptured = order.payment_status === "captured"
    const fulfillmentDelivered = order.fulfillment_status === "delivered"
    
    logger.info(`[debug-order] ----------------------------------------`)
    logger.info(`[debug-order] Will auto-complete? ${paymentCaptured && fulfillmentDelivered}`)

  } catch (error: any) {
    logger.error(`[debug-order] Error: ${error.message}`)
  }
}
