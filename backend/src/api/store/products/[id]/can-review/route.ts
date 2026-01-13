import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import ReviewsService from "../../../../../modules/reviews/service"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: product_id } = req.params
  const customerId = (req as any).auth_context?.actor_id
  
  if (!customerId) {
    return res.status(200).json({ can_review: false, reason: "auth_required" })
  }

  const reviewsModuleService: ReviewsService = req.scope.resolve("reviewsModuleService")

  const result = await reviewsModuleService.canReview(product_id, customerId)

  res.status(200).json(result)
}
