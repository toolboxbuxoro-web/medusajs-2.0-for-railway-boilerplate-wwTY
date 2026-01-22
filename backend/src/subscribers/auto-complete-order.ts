import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/framework/types"

/**
 * Automatically completes orders when payment is successful.
 * 
 * Uses direct SQL queries to check payment status from payment_session.data
 * because query.graph doesn't load nested relations correctly for payment data.
 * 
 * Payment is considered successful when:
 * - Payme: payme_state === 2 (transaction performed)
 * - Click: click_state === "completed"
 */

interface PaymentStatusResult {
  paid: boolean
  method: string | null
  details?: string
}

/**
 * Check payment status directly from payment_session table using SQL.
 * This bypasses query.graph limitations with nested relation loading.
 */
async function getPaymentStatusFromSession(
  pgConnection: any,
  orderId: string,
  logger: any
): Promise<PaymentStatusResult> {
  try {
    // Method 1: Check via medusa_order_id stored in session.data
    // This is set during PerformTransaction in payme-merchant.ts
    const directResult = await pgConnection.raw(`
      SELECT ps.data, ps.provider_id, ps.status
      FROM payment_session ps
      WHERE ps.data->>'medusa_order_id' = ?
      ORDER BY ps.created_at DESC
      LIMIT 1
    `, [orderId])
    
    const directRow = directResult?.rows?.[0]
    if (directRow) {
      const data = typeof directRow.data === 'string' 
        ? JSON.parse(directRow.data) 
        : directRow.data
      const providerId = directRow.provider_id || ''
      
      logger.debug(`[auto-complete-order] SQL Method 1: Found session via medusa_order_id, provider=${providerId}, payme_state=${data?.payme_state}, click_state=${data?.click_state}`)
      
      if (data?.payme_state === 2) {
        return { paid: true, method: 'payme', details: 'found via medusa_order_id' }
      }
      if (data?.click_state === 'completed') {
        return { paid: true, method: 'click', details: 'found via medusa_order_id' }
      }
    }
    
    // Method 2: Check via order.cart_id -> cart_payment_collection -> payment_session
    const cartResult = await pgConnection.raw(`
      SELECT o.cart_id FROM "order" o WHERE o.id = ?
    `, [orderId])
    
    const cartId = cartResult?.rows?.[0]?.cart_id
    if (!cartId) {
      logger.debug(`[auto-complete-order] SQL Method 2: No cart_id found for order ${orderId}`)
      return { paid: false, method: null, details: 'no cart_id found' }
    }
    
    logger.debug(`[auto-complete-order] SQL Method 2: Order ${orderId} has cart_id=${cartId}`)
    
    const sessionResult = await pgConnection.raw(`
      SELECT ps.data, ps.provider_id, ps.status
      FROM payment_session ps
      JOIN cart_payment_collection cpc 
        ON cpc.payment_collection_id = ps.payment_collection_id
      WHERE cpc.cart_id = ?
      ORDER BY ps.created_at DESC
      LIMIT 1
    `, [cartId])
    
    const sessionRow = sessionResult?.rows?.[0]
    if (sessionRow) {
      const data = typeof sessionRow.data === 'string' 
        ? JSON.parse(sessionRow.data) 
        : sessionRow.data
      const providerId = sessionRow.provider_id || ''
      
      logger.debug(`[auto-complete-order] SQL Method 2: Found session via cart_id, provider=${providerId}, payme_state=${data?.payme_state}, click_state=${data?.click_state}, status=${data?.status}`)
      
      if (data?.payme_state === 2) {
        return { paid: true, method: 'payme', details: 'found via cart_id' }
      }
      if (data?.click_state === 'completed') {
        return { paid: true, method: 'click', details: 'found via cart_id' }
      }
      
      // Also check if status indicates paid (for other payment methods)
      if (data?.status === 'captured' || data?.status === 'authorized') {
        return { paid: true, method: providerId, details: `status=${data.status}` }
      }
    }
    
    logger.debug(`[auto-complete-order] SQL: No successful payment found for order ${orderId}`)
    return { paid: false, method: null, details: 'no successful payment session' }
    
  } catch (err: any) {
    logger.error(`[auto-complete-order] SQL Error: ${err.message || err}`)
    return { paid: false, method: null, details: `error: ${err.message}` }
  }
}

export default async function autoCompleteOrder({
  event: { data, name },
  container,
}: SubscriberArgs<any>) {
  const logger = container.resolve("logger")
  const orderModule: IOrderModuleService = container.resolve(Modules.ORDER)

  // Extract order ID from event data
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

  logger.info(`[auto-complete-order] Processing event ${name} for order ${orderId}`)

  // For order.placed events, add a delay to allow payment processing to complete
  if (name === "order.placed") {
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  // Get PostgreSQL connection for direct queries
  const pgConnection = container.resolve("__pg_connection__")

  const checkAndCompleteOrder = async (attempt: number = 1): Promise<boolean> => {
    try {
      // First, check if order exists and is not already completed
      const orderResult = await pgConnection.raw(`
        SELECT id, status, cart_id FROM "order" WHERE id = ?
      `, [orderId])
      
      const order = orderResult?.rows?.[0]
      
      if (!order) {
        logger.warn(`[auto-complete-order] Order ${orderId} not found in database`)
        return false
      }
      
      if (order.status === "completed") {
        logger.debug(`[auto-complete-order] Order ${orderId} already completed, skipping`)
        return true
      }
      
      // Check payment status using SQL
      const paymentStatus = await getPaymentStatusFromSession(pgConnection, orderId!, logger)
      
      logger.info(`[auto-complete-order] Order ${orderId} [event: ${name}, attempt: ${attempt}]: paid=${paymentStatus.paid}, method=${paymentStatus.method || 'none'}, details=${paymentStatus.details || 'none'}`)
      
      if (paymentStatus.paid) {
        try {
          // Double-check status to avoid race conditions
          const currentOrder = await orderModule.retrieveOrder(orderId!)
          if (currentOrder.status === "completed") {
            logger.debug(`[auto-complete-order] Order ${orderId} already completed by another process`)
            return true
          }

          await orderModule.updateOrders([{
            id: orderId!,
            status: "completed",
          }])
          
          logger.info(`[auto-complete-order] ✅ Successfully completed order ${orderId} (payment via ${paymentStatus.method})`)
          return true
          
        } catch (completeError: any) {
          logger.error(`[auto-complete-order] ❌ Failed to complete order ${orderId}: ${completeError.message}`)
          return false
        }
      }
      
      // Retry logic for order.placed events
      if (name === "order.placed" && attempt < 3) {
        logger.debug(`[auto-complete-order] Order ${orderId} not paid yet, retrying in 5 seconds (attempt ${attempt + 1}/3)`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        return await checkAndCompleteOrder(attempt + 1)
      }
      
      logger.debug(`[auto-complete-order] Order ${orderId} not ready for completion: payment not confirmed`)
      return false
      
    } catch (error: any) {
      logger.error(`[auto-complete-order] Error checking order ${orderId}: ${error.message}`)
      return false
    }
  }

  try {
    const completed = await checkAndCompleteOrder()
    if (!completed && name === "order.placed") {
      logger.info(`[auto-complete-order] Order ${orderId} not completed, will be checked by fallback script`)
    }
  } catch (error: any) {
    logger.error(`[auto-complete-order] Error processing order ${orderId}: ${error.message}`)
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
    // Order events
    "order.payment_captured",
    "order.fulfillment_created",
    "order.updated",
    "order.placed",
  ],
}
