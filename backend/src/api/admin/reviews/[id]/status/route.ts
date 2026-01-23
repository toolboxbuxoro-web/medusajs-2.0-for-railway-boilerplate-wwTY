import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import ReviewsService from "../../../../../modules/reviews/service"

/**
 * POST /admin/reviews/:id/status
 * Update review status (for returning to pending or other status changes)
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const { status, rejection_reason } = req.body as { 
      status: "pending" | "approved" | "rejected" | "hidden"
      rejection_reason?: string 
    }

    if (!status) {
      res.status(400).json({ message: "Status is required" })
      return
    }

    const allowedStatuses = ["pending", "approved", "rejected", "hidden"]
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ 
        message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` 
      })
      return
    }

    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

    // Use updateReviewWithValidation for status changes
    const review = await reviewsModuleService.updateReviewWithValidation(id, {
      status,
      ...(rejection_reason && { rejection_reason }),
    })

    res.json({ review })
  } catch (error: any) {
    console.error(`[POST /admin/reviews/${req.params.id}/status] Error:`, error)
    
    if (error.message?.includes("not found")) {
      res.status(404).json({ message: "Review not found" })
      return
    }

    res.status(500).json({
      message: "Failed to update review status",
    })
  }
}
