
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"

export default async function orderSmsHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const notificationModule = container.resolve(Modules.NOTIFICATION)
  const orderModule = container.resolve(Modules.ORDER)

  const orderId = data.id

  try {
    const order = await orderModule.retrieveOrder(orderId, {
      relations: ["summary"]
    })

    logger.info(`[order-sms-handler] Processing order ${orderId}, metadata: ${JSON.stringify(order.metadata)}`)

    // Check if this was a quick order
    // In Medusa v2, cart metadata may or may not propagate to order.
    // We check order.metadata first, then fallback to fetching cart.
    let isQuickOrder = order.metadata?.is_quick_order
    let tmpPassword = order.metadata?.tmp_generated_password as string

    // If not in order.metadata, try to fetch from cart via DB query
    if (!isQuickOrder || !tmpPassword) {
      try {
        const pgConnection = container.resolve("__pg_connection__")
        
        // Find cart by order (Medusa v2 may store cart_id in order or we find via payment)
        // Try multiple approaches
        const queries = [
          `SELECT c.metadata FROM cart c WHERE c.id = (SELECT cart_id FROM "order" WHERE id = $1 LIMIT 1)`,
          `SELECT c.metadata FROM cart c 
           JOIN cart_payment_collection cpc ON cpc.cart_id = c.id
           JOIN payment_collection pc ON pc.id = cpc.payment_collection_id
           WHERE pc.id = (SELECT payment_collection_id FROM "order" WHERE id = $1 LIMIT 1)`
        ]

        for (const q of queries) {
          try {
            const result = await pgConnection.raw(q, [orderId])
            const rows = result?.rows || result || []
            const cartMetadata = rows?.[0]?.metadata
            
            if (cartMetadata) {
              const meta = typeof cartMetadata === 'string' ? JSON.parse(cartMetadata) : cartMetadata
              if (meta?.is_quick_order) {
                isQuickOrder = true
                tmpPassword = meta.tmp_generated_password
                logger.info(`[order-sms-handler] Found quick order metadata from cart: password=${tmpPassword ? 'YES' : 'NO'}`)
                break
              }
            }
          } catch (e: any) {
            // Continue to next query
          }
        }
      } catch (e: any) {
        logger.warn(`[order-sms-handler] Could not fetch cart metadata: ${e.message}`)
      }
    }

    const phone = order.shipping_address?.phone || ""
    const normalized = phone.replace(/\D/g, "")

    // 1. Send Credentials SMS for quick order
    if (isQuickOrder && tmpPassword && normalized) {
      try {
        const smsMessage = `Dannye dlya vhoda na sajt toolbox-tools.uz: Login: +${normalized}, Parol: ${tmpPassword}`
        
        await notificationModule.createNotifications({
          to: normalized,
          channel: "sms",
          template: "quick-order-credentials",
          data: { message: smsMessage }
        })
        logger.info(`[order-sms-handler] Sent credentials SMS to ${normalized}`)
      } catch (e: any) {
        logger.warn(`[order-sms-handler] Failed to send credentials SMS: ${e.message}`)
      }
    } else if (isQuickOrder && !tmpPassword) {
      logger.warn(`[order-sms-handler] Quick order but no password found in metadata`)
    }

    // 2. Send Order Confirmation SMS
    if (normalized) {
      try {
        const totalFormatted = new Intl.NumberFormat("ru-RU").format(Number(order.total) || 0)
        const smsMessage = `Vash zakaz #${order.display_id} na sajte toolbox-tools.uz uspeshno oformlen. Summa: ${totalFormatted} UZS`
        
        await notificationModule.createNotifications({
          to: normalized,
          channel: "sms",
          template: "order-confirmation",
          data: { message: smsMessage }
        })
        logger.info(`[order-sms-handler] Sent confirmation SMS to ${normalized}`)
      } catch (e: any) {
        logger.warn(`[order-sms-handler] Failed to send confirmation SMS: ${e.message}`)
      }
    }

  } catch (error: any) {
    logger.error(`[order-sms-handler] Error processing order ${orderId}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
