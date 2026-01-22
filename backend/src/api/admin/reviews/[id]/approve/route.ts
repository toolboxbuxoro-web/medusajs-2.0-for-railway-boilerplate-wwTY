import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ReviewsService from "../../../../../modules/reviews/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")
    const { id } = req.params

    if (!id || typeof id !== "string") {
      res.status(400).json({ message: "Invalid review ID" })
      return
    }

    const review = await reviewsModuleService.approveReview(id)

    res.json({ review })
  } catch (error: any) {
    console.error(`[POST /admin/reviews/${req.params.id}/approve] Error:`, error)
    
    if (error.message?.includes("not found") || error.message?.includes("does not exist")) {
      res.status(404).json({ message: "Review not found" })
      return
    }

    res.status(500).json({ message: "Failed to approve review" })
  }
}
