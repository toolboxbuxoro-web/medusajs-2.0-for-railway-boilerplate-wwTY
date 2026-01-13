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
    // Note: 'customer' is NOT a valid relation on Order in Medusa v2
    const order = await orderModule.retrieveOrder(orderId, {
      relations: ["summary", "shipping_address", "items"]
    })

    logger.info(`[order-sms-handler] Processing order ${orderId}, order.metadata: ${JSON.stringify(order.metadata || {})}`)

    // 2. Robust Phone Resolution Logic
    // Fallback priority: 
    // 1) Shipping address (best for delivery)
    // 2) Order metadata (special cases like quick order)
    const orderAny = order as any
    const rawPhone = 
      orderAny.shipping_address?.phone || 
      (orderAny.metadata?.phone as string) || 
      (orderAny.metadata?.quick_order_phone as string) || 
      ""

    const normalized = rawPhone.replace(/\D/g, "")
    
    logger.info(`[order-sms-handler] Resolution: phone=${normalized}`)

    if (!normalized) {
      logger.warn(`[order-sms-handler] Skip SMS: No phone number resolved for order ${orderId}`)
      return
    }

    // 3. Send Order Confirmation SMS
    try {
      const { ORDER_CONFIRMATION_TEXT } = await import("../modules/eskiz-sms/sms-texts.js")
      
      // Use summary total or fallback to raw total
      const total = Number(order.summary?.current_order_total || order.total || 0)
      // FORMAT: 1 250 000 (space separated thousands)
      const totalFormatted = new Intl.NumberFormat("ru-RU").format(total).replace(/\u00A0/g, " ")
      
      const orderDisplayId = order.display_id || orderId.slice(-8)
      
      const smsMessage = ORDER_CONFIRMATION_TEXT
        .replace("{orderId}", orderDisplayId)
        .replace("{sum}", totalFormatted)
      
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
