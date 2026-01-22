import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ReviewsService from "../../../../../modules/reviews/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")
    const { id } = req.params
    const adminId = (req as any).auth_context?.actor_id || "unknown"

    if (!id || typeof id !== "string") {
      res.status(400).json({ message: "Invalid review ID" })
      return
    }

    // Check current status before approving
    const currentReview = await reviewsModuleService.retrieveReview(id)
    
    if (currentReview.status === "approved") {
      res.status(400).json({ 
        message: "Review is already approved",
        review: currentReview
      })
      return
    }

    console.log(`[Admin Review Action] Admin ${adminId} approving review ${id} (was: ${currentReview.status})`)

    const review = await reviewsModuleService.approveReview(id)

    console.log(`[Admin Review Action] Review ${id} approved successfully by admin ${adminId}`)

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
