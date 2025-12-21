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
    // 1. Retrieve order with all necessary relations
    const order = await orderModule.retrieveOrder(orderId, {
      relations: ["summary", "shipping_address", "customer", "items"]
    })

    logger.info(`[order-sms-handler] Processing order ${orderId}, order.metadata: ${JSON.stringify(order.metadata || {})}`)

    // 2. Identify if this is a new customer/quick order and get the password
    let isQuickOrder = order.metadata?.is_quick_order
    let tmpPassword = order.metadata?.tmp_generated_password as string

    // If not in order.metadata, try to fetch from cart via DB query
    if (!tmpPassword) {
      try {
        const pgConnection = container.resolve("__pg_connection__")
        
        const queries = [
          {
            name: "order.cart_id direct",
            sql: `SELECT c.metadata FROM cart c 
                  JOIN "order" o ON o.cart_id = c.id 
                  WHERE o.id = $1`
          },
          {
            name: "via payment_collection",
            sql: `SELECT c.metadata FROM cart c 
                  JOIN cart_payment_collection cpc ON cpc.cart_id = c.id
                  JOIN "order" o ON o.payment_collection_id = cpc.payment_collection_id
                  WHERE o.id = $1`
          },
          {
            name: "by email match",
            sql: `SELECT c.metadata FROM cart c 
                  JOIN "order" o ON o.email = c.email
                  WHERE o.id = $1
                  ORDER BY c.created_at DESC LIMIT 1`
          }
        ]

        for (const { name, sql } of queries) {
          try {
            const result = await pgConnection.raw(sql, [orderId])
            const rows = result?.rows || result || []
            const cartMetadata = rows?.[0]?.metadata
            
            if (cartMetadata) {
              const meta = typeof cartMetadata === 'string' ? JSON.parse(cartMetadata) : cartMetadata
              if (meta?.tmp_generated_password) {
                tmpPassword = meta.tmp_generated_password
                isQuickOrder = meta.is_quick_order || isQuickOrder
                logger.info(`[order-sms-handler] Found password via database (${name})`)
                break
              }
            }
          } catch (e: any) {
            // Silently fail as we have multiple query approaches
          }
        }
      } catch (e: any) {
        logger.error(`[order-sms-handler] Error querying DB for cart metadata: ${e.message}`)
      }
    }

    // 3. Robust Phone Resolution Logic
    // Fallback priority: 
    // 1) Shipping address (best for delivery)
    // 2) Customer profile
    // 3) Order metadata (special cases)
    const rawPhone = 
      order.shipping_address?.phone || 
      order.customer?.phone || 
      (order.metadata?.phone as string) || 
      (order.metadata?.quick_order_phone as string) || 
      ""

    const normalized = rawPhone.replace(/\D/g, "")
    
    logger.info(`[order-sms-handler] Resolution: phone=${normalized}, isQuickOrder=${!!isQuickOrder}, hasPassword=${!!tmpPassword}`)

    if (!normalized) {
      logger.warn(`[order-sms-handler] Skip SMS: No phone number resolved for order ${orderId}`)
      return
    }

    // 4. Send Credentials SMS (Username/Password)
    if (tmpPassword) {
      try {
        const smsMessage = `Dannye dlya vhoda na sajt toolbox-tools.uz: Login: +${normalized}, Parol: ${tmpPassword}`
        
        await notificationModule.createNotifications({
          to: normalized,
          channel: "sms",
          template: "quick-order-credentials",
          data: { message: smsMessage }
        })
        logger.info(`[order-sms-handler] Successfully sent credentials SMS to +${normalized}`)
      } catch (e: any) {
        logger.error(`[order-sms-handler] Failed to send credentials SMS: ${e.message}`)
      }
    }

    // 5. Send Order Confirmation SMS
    try {
      // Use summary total or fallback to raw total
      const total = Number(order.summary?.current_order_total || order.total || 0)
      const totalFormatted = new Intl.NumberFormat("ru-RU").format(total)
      
      const orderDisplayId = order.display_id || orderId.slice(-8)
      const smsMessage = `Vash zakaz #${orderDisplayId} na sajte toolbox-tools.uz uspeshno oformlen. Summa: ${totalFormatted} UZS`
      
      await notificationModule.createNotifications({
        to: normalized,
        channel: "sms",
        template: "order-confirmation",
        data: { message: smsMessage }
      })
      logger.info(`[order-sms-handler] Successfully sent confirmation SMS to +${normalized}`)
    } catch (e: any) {
      logger.error(`[order-sms-handler] Failed to send confirmation SMS: ${e.message}`)
    }

  } catch (error: any) {
    logger.error(`[order-sms-handler] Error processing order ${orderId}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
