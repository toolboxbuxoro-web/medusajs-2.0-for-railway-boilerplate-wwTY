import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function transferCartMetadata({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderModule = container.resolve(Modules.ORDER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const orderId = data.id

  try {
    logger.info(`[transfer-cart-metadata] Processing order ${orderId}`)

    // Use remoteQuery to get order with linked cart via the order-cart link
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: orderId },
      fields: ["id", "metadata", "shipping_methods.*", "cart.*"]
    })

    const order: any = orders?.[0]
    if (!order) {
      logger.warn(`[transfer-cart-metadata] Order ${orderId} not found`)
      return
    }

    logger.info(`[transfer-cart-metadata] Order fetched. Has cart: ${!!order.cart}`)

    // Check if order already has bts_delivery
    if (order.metadata?.bts_delivery) {
      logger.info(`[transfer-cart-metadata] Order ${orderId} already has bts_delivery metadata`)
      return
    }

    // Try to get cart data from the linked cart
    let cart = order.cart
    
    // Fallback: If cart is null, try to get it via remoteQuery on order_cart link
    if (!cart) {
      logger.info(`[transfer-cart-metadata] Cart not in order relation, trying remoteQuery fallback`)
      try {
        const remoteQuery = container.resolve("remoteQuery")
        const cartModule = container.resolve(Modules.CART)
        
        // Query the link table
        const links = await remoteQuery({
          entryPoint: "order_cart",
          fields: ["cart_id"],
          variables: { filters: { order_id: orderId } }
        })
        
        const cartId = links?.[0]?.cart_id
        if (cartId) {
          cart = await cartModule.retrieveCart(cartId, { select: ["id", "metadata"] })
          logger.info(`[transfer-cart-metadata] Found cart ${cartId} via link fallback`)
        }
      } catch (linkError: any) {
        logger.warn(`[transfer-cart-metadata] Link fallback failed: ${linkError.message}`)
      }
    }
    
    if (!cart) {
      logger.warn(`[transfer-cart-metadata] Order ${orderId} has no linked cart (all methods exhausted)`)
      return
    }

    const btsDelivery = cart.metadata?.bts_delivery
    if (!btsDelivery) {
      logger.warn(`[transfer-cart-metadata] Cart ${cart.id} has no bts_delivery in metadata. Cart metadata: ${JSON.stringify(cart.metadata || {})}`)
      return
    }

    logger.info(`[transfer-cart-metadata] Found bts_delivery: ${JSON.stringify(btsDelivery)}`)

    // Update order with bts_delivery metadata
    await orderModule.updateOrders([{
      id: orderId,
      metadata: {
        ...(order.metadata || {}),
        bts_delivery: btsDelivery
      }
    }])

    logger.info(`[transfer-cart-metadata] Successfully updated order ${orderId} with bts_delivery metadata`)

    // Log shipping cost issue
    if (order.shipping_methods?.length && btsDelivery.estimated_cost) {
      const shippingMethod = order.shipping_methods[0]
      if (Number(shippingMethod.amount) === 0 && Number(btsDelivery.estimated_cost) > 0) {
        logger.warn(`[transfer-cart-metadata] Order ${orderId} has 0 shipping cost but BTS estimate is ${btsDelivery.estimated_cost}`)
      }
    }

  } catch (error: any) {
    logger.error(`[transfer-cart-metadata] Error processing order ${orderId}: ${error.message}`)
    logger.error(`[transfer-cart-metadata] Stack: ${error.stack}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
