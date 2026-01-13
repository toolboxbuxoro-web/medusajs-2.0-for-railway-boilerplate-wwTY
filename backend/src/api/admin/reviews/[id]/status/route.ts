import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ReviewsService from "../../../../../modules/reviews/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const reviewsModuleService: ReviewsService = req.scope.resolve("reviewsModuleService")
  const { id } = req.params
  const { status, rejection_reason } = req.body as { 
    status: "approved" | "rejected",
    rejection_reason?: string 
  }

  if (!status || !["approved", "rejected"].includes(status)) {
    res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'." })
    return
  }

  // Use the service method that emits the event
  const review = await reviewsModuleService.updateReviewStatus(id, status, rejection_reason)

  res.json({ review })
}
