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
    const adminId = (req as any).auth_context?.actor_id || "unknown"

    if (!id || typeof id !== "string") {
      res.status(400).json({ message: "Invalid review ID" })
      return
    }

    // Rejection reason is required for reject action
    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      res.status(400).json({ 
        message: "Rejection reason is required when rejecting a review" 
      })
      return
    }

    // Validate rejection reason length
    const trimmedReason = reason.trim()
    if (trimmedReason.length > 1000) {
      res.status(400).json({ 
        message: "Rejection reason must be 1000 characters or less." 
      })
      return
    }

    // Check current status before rejecting
    const currentReview = await reviewsModuleService.retrieveReview(id)
    
    if (currentReview.status === "rejected") {
      res.status(400).json({ 
        message: "Review is already rejected",
        review: currentReview
      })
      return
    }

    console.log(`[Admin Review Action] Admin ${adminId} rejecting review ${id} (was: ${currentReview.status}), reason: ${trimmedReason.substring(0, 50)}...`)

    const review = await reviewsModuleService.rejectReview(
      id, 
      trimmedReason
    )

    console.log(`[Admin Review Action] Review ${id} rejected successfully by admin ${adminId}`)

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
