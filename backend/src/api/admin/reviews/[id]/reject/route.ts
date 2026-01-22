import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ReviewsService from "../../../../../modules/reviews/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")
    const { id } = req.params
    const { reason } = req.body as { reason?: string }

    if (!id || typeof id !== "string") {
      res.status(400).json({ message: "Invalid review ID" })
      return
    }

    // Validate rejection reason length if provided
    if (reason && typeof reason === "string" && reason.trim().length > 1000) {
      res.status(400).json({ 
        message: "Rejection reason must be 1000 characters or less." 
      })
      return
    }

    const review = await reviewsModuleService.rejectReview(
      id, 
      reason?.trim() || undefined
    )

    res.json({ review })
  } catch (error: any) {
    console.error(`[POST /admin/reviews/${req.params.id}/reject] Error:`, error)
    
    if (error.message?.includes("not found") || error.message?.includes("does not exist")) {
      res.status(404).json({ message: "Review not found" })
      return
    }

    res.status(500).json({ message: "Failed to reject review" })
  }
}
