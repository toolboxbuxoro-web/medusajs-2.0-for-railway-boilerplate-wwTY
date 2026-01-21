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
    // We intentionally return 200 here so the storefront can always
    // render a consistent shape and simply react to the flag.
    return res.status(200).json({ can_review: false, reason: "auth_required" })
  }

  const reviewsModuleService: ReviewsService = req.scope.resolve("reviewsModuleService")

  try {
    const result = await reviewsModuleService.canReview(product_id, customerId)

    // Do not expose internal linkage details such as order_id to the client.
    // We only return the high-level eligibility flags and reason.
    const { can_review, reason } = result as any

    res.status(200).json({
      can_review: Boolean(can_review),
      ...(reason && { reason }),
    })
  } catch (e) {
    // In case of unexpected errors, fail closed (no right to review)
    res.status(200).json({
      can_review: false,
      reason: "error",
    })
  }
}
