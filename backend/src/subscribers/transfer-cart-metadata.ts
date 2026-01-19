import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"

export default async function transferCartMetadata({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderModule = container.resolve(Modules.ORDER)
  const cartModule = container.resolve(Modules.CART)

  const orderId = data.id

  try {
    const order = await orderModule.retrieveOrder(orderId, {
      relations: ["shipping_methods"]
    })

    // x@ts-ignore - cart_id exists at runtime but missing from some DTO types
    const cartId = (order as any).cart_id

    if (!cartId) {
      logger.warn(`[transfer-cart-metadata] Order ${orderId} has no cart_id, skipping metadata transfer`)
      return
    }

    const cart = await cartModule.retrieveCart(cartId, {
      select: ["metadata", "shipping_methods"]
    })

    const cartMetadata = cart.metadata || {}
    const btsDelivery = cartMetadata.bts_delivery

    if (btsDelivery) {
      logger.info(`[transfer-cart-metadata] Transferring BTS delivery metadata to order ${orderId}`)
      
      await orderModule.updateOrders([{
        id: orderId,
        metadata: {
          ...order.metadata,
          bts_delivery: btsDelivery
        }
      }])

      // Check for zero shipping cost
      if (order.shipping_methods?.length && (btsDelivery as any).estimated_cost) {
        const shippingMethod = order.shipping_methods[0]
        if (Number(shippingMethod.amount) === 0) {
           const estimatedCost = Number((btsDelivery as any).estimated_cost)
           if (estimatedCost > 0) {
             logger.warn(`[transfer-cart-metadata] Order ${orderId} has 0 shipping cost but BTS estimate is ${estimatedCost}. Storefront should handle this fallback.`)
           }
        }
      }
    }

  } catch (error: any) {
    logger.error(`[transfer-cart-metadata] Error processing order ${orderId}: ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
