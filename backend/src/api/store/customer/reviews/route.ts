import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/customer/reviews
 * Returns customer's reviews and review statuses for their order items
 * 
 * TEMPORARY: Disabled due to schema issues with order_item table
 * TODO: Fix to use correct Medusa 2.0 schema or query API
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ error: "Authentication required" })
  }

  try {
    // TEMPORARY: Return empty data until we figure out the correct order_item schema
    // The order_item table in Medusa 2.0 doesn't have product_id or variant_id columns
    console.log(`[GET /store/customer/reviews] Temporary stub - returning empty data for customer ${customerId}`)
    
    return res.json({
      pending_items: [],
      reviews: [],
      reviews_by_product: {}
    })
  } catch (error: any) {
    console.error("[GET /store/customer/reviews] Error:", error)
    res.status(500).json({ error: "Failed to fetch reviews" })
  }
}
