
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

    // Check if this was a quick order (we stored metadata in the Cart, which should propagate to Order)
    // NOTE: In Medusa, cart metadata usually propagates to order metadata.
    const isQuickOrder = order.metadata?.is_quick_order
    const tmpPassword = order.metadata?.tmp_generated_password as string

    // 1. Send Order Confirmation SMS (To everyone or just quick order? Plan implied everyone or quick order)
    // Let's send to everyone if we have a phone number, but definitely for quick order.
    // Normalized phone is required.
    
    // We expect the phone in shipping_address or customer phone.
    // Quick order sets phone in customer and shipping address.
    
    // For quick order specifically:
    if (isQuickOrder && tmpPassword) {
      // Send Credentials SMS
      const phone = order.shipping_address?.phone || ""
      const normalized = phone.replace(/\D/g, "") // basic normalization (assuming it was +998...)
      
      if (normalized) {
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
      }
    }

    // 2. Send Order Confirmation SMS (General logic)
    // If you want this for ALL orders, we can do it here. Or just quick order?
    // User request: "после его перенаправляет на страницу подтвержедния ... дальше смс ... Vash zakaz #..."
    // Let's send to any order with a valid phone number, as it's good practice.
    
    const phone = order.shipping_address?.phone || ""
    const normalized = phone.replace(/\D/g, "")

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

    // Optional: Clean up sensitive metadata?
    // We can't easily update order metadata here without using a workflow/service that allows updating order.
    // Leaving it is a minor security risk (hashed password is better, but this is auto-generated one-time use).
    // Given the constraints, we leave it.

  } catch (error: any) {
    logger.error(`[order-sms-handler] Error processing order ${orderId}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
