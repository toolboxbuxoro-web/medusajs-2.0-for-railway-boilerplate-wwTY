import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import ReviewsService from "../../../../../modules/reviews/service"

/**
 * POST /admin/reviews/:id/reject
 * Reject a review with optional reason
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const { reason } = req.body as { reason?: string }

    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

    const review = await reviewsModuleService.rejectReview(id, reason)

    res.json({ review })
  } catch (error: any) {
    console.error(`[POST /admin/reviews/${req.params.id}/reject] Error:`, error)
    
    if (error.message?.includes("not found")) {
      res.status(404).json({ message: "Review not found" })
      return
    }

    res.status(500).json({
      message: "Failed to reject review",
    })
  }
}
