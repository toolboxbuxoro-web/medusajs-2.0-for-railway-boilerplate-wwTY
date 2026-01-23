import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import ReviewsService from "../../../../modules/reviews/service"

/**
 * GET /admin/reviews/:id
 * Get a single review by ID
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params

    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

    const review = await reviewsModuleService.retrieveReviewWithConversion(id)

    res.json({ review })
  } catch (error: any) {
    console.error(`[GET /admin/reviews/${req.params.id}] Error:`, error)
    
    if (error.message?.includes("not found")) {
      res.status(404).json({ message: "Review not found" })
      return
    }

    res.status(500).json({
      message: "Failed to fetch review",
    })
  }
}
