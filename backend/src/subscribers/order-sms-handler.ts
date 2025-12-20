
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

    logger.info(`[order-sms-handler] Processing order ${orderId}, order.metadata: ${JSON.stringify(order.metadata || {})}`)

    // Check if this was a quick order
    let isQuickOrder = order.metadata?.is_quick_order
    let tmpPassword = order.metadata?.tmp_generated_password as string

    // If not in order.metadata, try to fetch from cart via DB query
    if (!tmpPassword) {
      try {
        const pgConnection = container.resolve("__pg_connection__")
        
        // Medusa v2: Order may have cart_id column, or we find via payment_collection
        // Try multiple approaches with detailed logging
        const queries = [
          // Approach 1: Direct cart_id on order table (Medusa v2 style)
          {
            name: "order.cart_id direct",
            sql: `SELECT c.metadata FROM cart c 
                  JOIN "order" o ON o.cart_id = c.id 
                  WHERE o.id = $1`
          },
          // Approach 2: Via payment collection link
          {
            name: "via payment_collection",
            sql: `SELECT c.metadata FROM cart c 
                  JOIN cart_payment_collection cpc ON cpc.cart_id = c.id
                  JOIN "order" o ON o.payment_collection_id = cpc.payment_collection_id
                  WHERE o.id = $1`
          },
          // Approach 3: Find cart by matching email/created time (rough)
          {
            name: "by email match",
            sql: `SELECT c.metadata FROM cart c 
                  WHERE c.email = (SELECT email FROM "order" WHERE id = $1)
                  ORDER BY c.created_at DESC LIMIT 1`
          }
        ]

        for (const { name, sql } of queries) {
          try {
            logger.info(`[order-sms-handler] Trying query: ${name}`)
            const result = await pgConnection.raw(sql, [orderId])
            const rows = result?.rows || result || []
            const cartMetadata = rows?.[0]?.metadata
            
            if (cartMetadata) {
              const meta = typeof cartMetadata === 'string' ? JSON.parse(cartMetadata) : cartMetadata
              logger.info(`[order-sms-handler] Found cart metadata via ${name}: ${JSON.stringify(meta)}`)
              
              if (meta?.is_quick_order || meta?.tmp_generated_password) {
                isQuickOrder = meta.is_quick_order || isQuickOrder
                tmpPassword = meta.tmp_generated_password || tmpPassword
                logger.info(`[order-sms-handler] Quick order detected! password=${tmpPassword ? 'YES' : 'NO'}`)
                break
              }
            }
          } catch (e: any) {
            logger.warn(`[order-sms-handler] Query "${name}" failed: ${e.message}`)
          }
        }
      } catch (e: any) {
        logger.error(`[order-sms-handler] Could not fetch cart metadata: ${e.message}`)
      }
    }

    const phone = order.shipping_address?.phone || ""
    const normalized = phone.replace(/\D/g, "")

    // 1. Send Credentials SMS for quick order
    if (tmpPassword && normalized) {
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
    } else {
      logger.info(`[order-sms-handler] No credentials SMS: isQuickOrder=${isQuickOrder}, hasPassword=${!!tmpPassword}, hasPhone=${!!normalized}`)
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
