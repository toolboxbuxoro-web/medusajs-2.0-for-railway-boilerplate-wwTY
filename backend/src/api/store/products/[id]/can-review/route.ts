import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import ReviewsService from "../../../../../modules/reviews/service"

/**
 * GET /store/products/:id/can-review
 * Check if the current customer can review a product
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: product_id } = req.params
  const customerId = (req as any).auth_context?.actor_id
  
  if (!customerId) {
    // Return 200 so the storefront can always render consistently
    return res.status(200).json({ can_review: false, reason: "auth_required" })
  }

  const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

  try {
    const pgConnection = req.scope.resolve("__pg_connection__")
    const result = await reviewsModuleService.canReview(product_id, customerId, pgConnection)

    // Do not expose internal details like order_id to the client
    const { can_review, reason } = result as any

    res.status(200).json({
      can_review: Boolean(can_review),
      ...(reason && { reason }),
    })
  } catch (e) {
    // Fail closed (no right to review)
    res.status(200).json({
      can_review: false,
      reason: "error",
    })
  }
}
