import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import ReviewsService from "../../../../../modules/reviews/service"

/**
 * POST /admin/reviews/:id/response
 * Add or update admin response to a review
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const { response } = req.body as { response: string }

    if (!response || typeof response !== "string" || response.trim().length === 0) {
      res.status(400).json({ message: "Response is required" })
      return
    }

    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

    const review = await reviewsModuleService.addAdminResponse(id, response)

    res.json({ review })
  } catch (error: any) {
    console.error(`[POST /admin/reviews/${req.params.id}/response] Error:`, error)
    
    if (error.message?.includes("not found")) {
      res.status(404).json({ message: "Review not found" })
      return
    }

    if (error.message?.includes("cannot be empty") || error.message?.includes("2000 characters")) {
      res.status(400).json({ message: error.message })
      return
    }

    res.status(500).json({
      message: "Failed to add admin response",
    })
  }
}
