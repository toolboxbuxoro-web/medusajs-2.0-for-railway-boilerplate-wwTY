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

    // Use the service method that emits the event
    const review = await reviewsModuleService.updateReviewStatus(
      id, 
      status, 
      rejection_reason?.trim() || undefined
    )

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
