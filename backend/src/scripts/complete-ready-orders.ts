import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

/**
 * Fallback script to complete orders that have successful payment but are still pending.
 * 
 * Uses direct SQL queries to check payment status from payment_session.data.
 * Run: medusa run script complete-ready-orders
 */

interface PaymentStatusResult {
  paid: boolean
  method: string | null
}

async function getPaymentStatusFromSession(
  pgConnection: any,
  orderId: string,
  cartId: string | null
): Promise<PaymentStatusResult> {
  try {
    // Method 1: Check via medusa_order_id in session.data
    const directResult = await pgConnection.raw(`
      SELECT ps.data, ps.provider_id
      FROM payment_session ps
      WHERE ps.data->>'medusa_order_id' = ?
      ORDER BY ps.created_at DESC
      LIMIT 1
    `, [orderId])
    
    if (directResult?.rows?.[0]) {
      const data = typeof directResult.rows[0].data === 'string' 
        ? JSON.parse(directResult.rows[0].data) 
        : directResult.rows[0].data
      
      if (data?.payme_state === 2) {
        return { paid: true, method: 'payme' }
      }
      if (data?.click_state === 'completed' || data?.click_state === 'paid') {
        return { paid: true, method: 'click' }
      }
    }
    
    // Method 2: Check via cart_id
    if (!cartId) {
      return { paid: false, method: null }
    }
    
    const sessionResult = await pgConnection.raw(`
      SELECT ps.data, ps.provider_id
      FROM payment_session ps
      JOIN cart_payment_collection cpc 
        ON cpc.payment_collection_id = ps.payment_collection_id
      WHERE cpc.cart_id = ?
      ORDER BY ps.created_at DESC
      LIMIT 1
    `, [cartId])
    
    if (sessionResult?.rows?.[0]) {
      const data = typeof sessionResult.rows[0].data === 'string' 
        ? JSON.parse(sessionResult.rows[0].data) 
        : sessionResult.rows[0].data
      
      if (data?.payme_state === 2) {
        return { paid: true, method: 'payme' }
      }
      if (data?.click_state === 'completed' || data?.click_state === 'paid') {
        return { paid: true, method: 'click' }
      }
      if (data?.status === 'captured' || data?.status === 'authorized') {
        return { paid: true, method: sessionResult.rows[0].provider_id || 'unknown' }
      }
    }
    
    return { paid: false, method: null }
  } catch {
    return { paid: false, method: null }
  }
}

export default async function completeReadyOrders({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const orderModule: IOrderModuleService = container.resolve(Modules.ORDER)
  const pgConnection = container.resolve("__pg_connection__")

  logger.info("[complete-ready-orders] Starting check for ready orders...")

  try {
    // Find all pending orders with their cart_id
    const pendingOrdersResult = await pgConnection.raw(`
      SELECT id, status, cart_id, created_at
      FROM "order"
      WHERE status = 'pending'
      ORDER BY created_at DESC
      LIMIT 100
    `)

    const pendingOrders = pendingOrdersResult?.rows || []
    logger.info(`[complete-ready-orders] Found ${pendingOrders.length} pending orders`)

    if (pendingOrders.length === 0) {
      logger.info("[complete-ready-orders] No pending orders found")
      return
    }

    let completedCount = 0
    let skippedCount = 0

    for (const order of pendingOrders) {
      const orderId = order.id
      const cartId = order.cart_id

      const paymentStatus = await getPaymentStatusFromSession(pgConnection, orderId, cartId)

      if (paymentStatus.paid) {
        try {
          // Double-check current status
          const currentOrder = await orderModule.retrieveOrder(orderId)
          if (currentOrder.status === "completed") {
            skippedCount++
            continue
          }

          await orderModule.updateOrders([{
            id: orderId,
            status: "completed",
          }])

          logger.info(`[complete-ready-orders] ✅ Completed order ${orderId} (${paymentStatus.method})`)
          completedCount++
        } catch (error: any) {
          logger.error(`[complete-ready-orders] ❌ Failed to complete ${orderId}: ${error.message}`)
        }
      } else {
        logger.debug(`[complete-ready-orders] Order ${orderId}: payment not confirmed`)
        skippedCount++
      }
    }

    logger.info(`[complete-ready-orders] ✅ Completed: ${completedCount}, Skipped: ${skippedCount}`)
  } catch (error: any) {
    logger.error(`[complete-ready-orders] Error: ${error.message}`)
    throw error
  }
}
