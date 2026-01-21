import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import ReviewsService from "../../../../../modules/reviews/service"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")
  const { id } = req.params

  const review = await reviewsModuleService.approveReview(id)

  res.json({ review })
}
