import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  
  const order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })
  const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)

  // Email notification is disabled - no email provider configured
  // To enable, configure RESEND_API_KEY or SENDGRID_API_KEY in Railway
  // try {
  //   await notificationModuleService.createNotifications({
  //     to: order.email,
  //     channel: 'email',
  //     template: EmailTemplates.ORDER_PLACED,
  //     data: {
  //       emailOptions: {
  //         replyTo: 'info@toolbox-tools.uz',
  //         subject: 'Ваш заказ оформлен!'
  //       },
  //       order,
  //       shippingAddress,
  //       preview: 'Спасибо за ваш заказ!'
  //     }
  //   })
  // } catch (error) {
  //   console.error('Error sending order confirmation email:', error)
  // }

  // Send SMS notification via Eskiz
  const phone = shippingAddress?.phone || order.shipping_address?.phone
  if (phone) {
    try {
      // Format order total (in UZS)
      const total = Number(order.summary?.current_order_total || order.total || 0)
      const formattedTotal = new Intl.NumberFormat('uz-UZ').format(total)
      
      // IMPORTANT: SMS message MUST match the approved Eskiz template exactly!
      // Approved format: "Vash zakaz #12345 na sajte toolbox-tools.uz uspeshno oformlen. Summa: 150,000 UZS"
      const orderId = order.display_id || order.id.slice(-8)
      const message = `Vash zakaz #${orderId} na sajte toolbox-tools.uz uspeshno oformlen. Summa: ${formattedTotal} UZS`
      
      await notificationModuleService.createNotifications({
        to: phone,
        channel: 'sms',
        template: 'order-confirmation',
        data: {
          message,
          order_id: order.id,
          display_id: order.display_id
        }
      })
      console.log(`SMS notification sent to ${phone} for order ${order.id}`)
    } catch (error) {
      console.error('Error sending SMS notification:', error)
    }
  } else {
    console.warn(`No phone number found for order ${order.id}, skipping SMS`)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}

