import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ReviewsService from "../../../../../modules/reviews/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")
    const { id } = req.params
    const { status, rejection_reason } = req.body as { 
      status: "pending" | "approved" | "rejected" | "hidden",
      rejection_reason?: string 
    }
    const adminId = (req as any).auth_context?.actor_id || "unknown"

    if (!id || typeof id !== "string") {
      res.status(400).json({ message: "Invalid review ID" })
      return
    }

    if (!status || !["pending", "approved", "rejected", "hidden"].includes(status)) {
      res.status(400).json({ 
        message: "Invalid status. Must be 'pending', 'approved', 'rejected', or 'hidden'." 
      })
      return
    }

    // Validate rejection_reason length if provided
    if (rejection_reason && typeof rejection_reason === "string" && rejection_reason.length > 1000) {
      res.status(400).json({ 
        message: "Rejection reason must be 1000 characters or less." 
      })
      return
    }

    // Require rejection_reason when status is rejected
    if (status === "rejected" && (!rejection_reason || rejection_reason.trim().length === 0)) {
      res.status(400).json({ 
        message: "Rejection reason is required when status is 'rejected'" 
      })
      return
    }

    // Check current status before updating
    const currentReview = await reviewsModuleService.retrieveReview(id)
    
    if (currentReview.status === status) {
      res.status(400).json({ 
        message: `Review is already ${status}`,
        review: currentReview
      })
      return
    }

    console.log(`[Admin Review Action] Admin ${adminId} updating review ${id} status from ${currentReview.status} to ${status}${rejection_reason ? `, reason: ${rejection_reason.substring(0, 50)}...` : ""}`)

    // Use the service method that emits the event
    const review = await reviewsModuleService.updateReviewStatus(
      id, 
      status, 
      rejection_reason?.trim() || undefined
    )

    console.log(`[Admin Review Action] Review ${id} status updated successfully by admin ${adminId}`)

    res.json({ review })
  } catch (error: any) {
    console.error(`[POST /admin/reviews/${req.params.id}/status] Error:`, error)
    
    // Check if review not found
    if (error.message?.includes("not found") || error.message?.includes("does not exist")) {
      res.status(404).json({ message: "Review not found" })
      return
    }

    res.status(500).json({ message: "Failed to update review status" })
  }
}
