import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

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

    // Determine success or failure
    const isSuccess = status === "success" || transaction_id

    if (isSuccess) {
      // Redirect to success page
      const successUrl = `${process.env.STORE_CORS || 'http://localhost:8000'}/order/confirmed?order_id=${order_id}`
      return res.redirect(successUrl)
    } else {
      // Redirect to failure page
      const failureUrl = `${process.env.STORE_CORS || 'http://localhost:8000'}/checkout?payment=failed`
      return res.redirect(failureUrl)
    }
  } catch (error) {
    console.error("Error processing Payme callback:", error)
    
    // Redirect to error page
    const errorUrl = `${process.env.STORE_CORS || 'http://localhost:8000'}/checkout?payment=error`
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
