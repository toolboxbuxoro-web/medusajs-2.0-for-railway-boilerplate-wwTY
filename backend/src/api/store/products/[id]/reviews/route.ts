import { 
  MedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import ReviewsService from "../../../../../modules/reviews/service"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { limit = 10, offset = 0, sort = "newest" } = req.query as any

  const reviewsModuleService: ReviewsService = req.scope.resolve("reviewsModuleService")

  const order = sort === "rating_desc" ? { rating: "DESC" } : { created_at: "DESC" }

  // Only return approved reviews
  const [reviews, count] = await reviewsModuleService.listAndCountReviews(
    { product_id: id, status: "approved" },
    {
      take: parseInt(limit),
      skip: parseInt(offset),
      order,
    }
  )

  // Fetch all approved ratings for average and distribution
  const allApproved = await reviewsModuleService.listReviews(
    { product_id: id, status: "approved" },
    { select: ["rating"] }
  )
  
  const totalRating = allApproved.reduce((acc, curr) => acc + curr.rating, 0)
  const average_rating = allApproved.length > 0 ? parseFloat((totalRating / allApproved.length).toFixed(1)) : 0

  const distribution = {
    1: allApproved.filter(r => r.rating === 1).length,
    2: allApproved.filter(r => r.rating === 2).length,
    3: allApproved.filter(r => r.rating === 3).length,
    4: allApproved.filter(r => r.rating === 4).length,
    5: allApproved.filter(r => r.rating === 5).length,
  }

  res.status(200).json({
    reviews,
    average_rating,
    distribution,
    total: count,
  })
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id: product_id } = req.params
  const { rating, comment } = req.body as any
  
  const customerId = (req as any).auth_context?.actor_id
  
  if (!customerId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const reviewsModuleService: ReviewsService = req.scope.resolve("reviewsModuleService")

  // Use the service method for validation
  const eligibility = await reviewsModuleService.canReview(product_id, customerId)

  if (!eligibility.can_review) {
    const status = eligibility.reason === "already_reviewed" ? 400 : 403
    return res.status(status).json({ 
      error: eligibility.reason === "already_reviewed" 
        ? "You have already reviewed this product" 
        : "You can only review products from completed orders",
      can_review: false 
    })
  }

  // 3. Create review
  const review = await reviewsModuleService.createReviews({
    product_id,
    customer_id: customerId,
    order_id: eligibility.order_id!,
    rating: parseInt(rating),
    comment,
    status: "pending"
  })

  res.status(201).json({ review })
}
