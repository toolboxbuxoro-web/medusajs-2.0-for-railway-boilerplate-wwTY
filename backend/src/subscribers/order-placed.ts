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

  // Send email notification
  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          replyTo: 'info@toolbox-tools.uz',
          subject: 'Ваш заказ оформлен!'
        },
        order,
        shippingAddress,
        preview: 'Спасибо за ваш заказ!'
      }
    })
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
  }

  // Send SMS notification via Eskiz
  const phone = shippingAddress?.phone || order.shipping_address?.phone
  if (phone) {
    try {
      // Format order total
      const total = Number(order.summary?.current_order_total || order.total || 0)
      const formattedTotal = new Intl.NumberFormat('uz-UZ').format(total)
      
      // Build SMS message
      const message = `Toolbox: Ваш заказ #${order.display_id || order.id.slice(-8)} на сумму ${formattedTotal} UZS успешно оформлен! Мы свяжемся с вами для подтверждения доставки.`
      
      await notificationModuleService.createNotifications({
        to: phone,
        channel: 'sms',
        template: 'order-confirmation', // Template name (not used by Eskiz, but required)
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

