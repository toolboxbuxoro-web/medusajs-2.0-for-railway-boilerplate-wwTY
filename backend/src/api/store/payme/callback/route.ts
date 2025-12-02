import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Get first URL from comma-separated CORS string
 */
function getFirstStoreUrl(): string {
  const storeCors = process.env.STORE_CORS || 'http://localhost:8000'
  // If STORE_CORS contains multiple URLs, take the first one
  return storeCors.split(',')[0].trim()
}

/**
 * Payme callback endpoint
 * This endpoint handles the redirect back from Payme after payment
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { order_id, transaction_id, status } = req.query as Record<string, string>
    
    // Log the callback for debugging
    console.log("Payme callback received:", {
      order_id,
      transaction_id,
      status,
      query: req.query
    })

    // Get store base URL
    const storeBaseUrl = getFirstStoreUrl()

    // Determine success or failure
    const isSuccess = status === "success" || transaction_id

    if (isSuccess && order_id) {
      // Try to get order information to build proper URL with country code
      try {
        const remoteQuery = req.scope.resolve("remoteQuery")
        
        // First, try to find as Order
        let orderQuery = await remoteQuery({
          entryPoint: "order",
          fields: ["id", "shipping_address.country_code"],
          variables: { id: order_id }
        })
        
        let order = orderQuery[0]
        let countryCode = 'uz'
        let finalOrderId = order_id
        
        // If not found as Order, try as Cart (order might not be created yet)
        if (!order) {
          const cartQuery = await remoteQuery({
            entryPoint: "cart",
            fields: ["id", "shipping_address.country_code"],
            variables: { id: order_id }
          })
          
          const cart = cartQuery[0]
          if (cart) {
            countryCode = cart?.shipping_address?.country_code?.toLowerCase() || 'uz'
            // For cart, we'll redirect to checkout with success parameter
            // The frontend should handle completing the order
            const successUrl = `${storeBaseUrl}/ru/${countryCode}/checkout?payment=success&cart_id=${order_id}`
            console.log("Redirecting to checkout with cart (order not yet created):", successUrl)
            return res.redirect(successUrl)
          }
        } else {
          // Order found, use its country code
          countryCode = order?.shipping_address?.country_code?.toLowerCase() || 'uz'
          finalOrderId = order.id
        }
        
        const locale = 'ru' // Default locale, can be made configurable
        
        // Build proper URL: /[locale]/[countryCode]/order/confirmed/[id]
        const successUrl = `${storeBaseUrl}/${locale}/${countryCode}/order/confirmed/${finalOrderId}`
        console.log("Redirecting to success URL:", successUrl)
        return res.redirect(successUrl)
      } catch (orderError) {
        console.error("Error fetching order/cart for redirect:", orderError)
        // Fallback: use order_id as path parameter with default country
        const successUrl = `${storeBaseUrl}/ru/uz/order/confirmed/${order_id}`
        console.log("Redirecting to fallback success URL:", successUrl)
        return res.redirect(successUrl)
      }
    } else {
      // Redirect to failure page
      const failureUrl = `${storeBaseUrl}/checkout?payment=failed`
      console.log("Redirecting to failure URL:", failureUrl)
      return res.redirect(failureUrl)
    }
  } catch (error) {
    console.error("Error processing Payme callback:", error)
    
    // Redirect to error page
    const storeBaseUrl = getFirstStoreUrl()
    const errorUrl = `${storeBaseUrl}/checkout?payment=error`
    console.log("Redirecting to error URL:", errorUrl)
    return res.redirect(errorUrl)
  }
}

/**
 * Payme webhook endpoint for server-to-server notifications
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const webhookData = req.body
    
    console.log("Payme webhook received:", webhookData)

    // Here you would:
    // 1. Verify the webhook signature
    // 2. Update the order/payment status in your database
    // 3. Trigger any necessary business logic

    // For now, just acknowledge receipt
    return res.json({
      success: true,
      message: "Webhook received"
    })
  } catch (error: any) {
    console.error("Error processing Payme webhook:", error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
