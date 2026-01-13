import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ReviewsService from "../../../../../modules/reviews/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const reviewsModuleService: ReviewsService = req.scope.resolve("reviewsModuleService")
  const { id } = req.params
  const { reason } = req.body as { reason?: string }

  const review = await reviewsModuleService.rejectReview(id, reason)

  res.json({ review })
}
