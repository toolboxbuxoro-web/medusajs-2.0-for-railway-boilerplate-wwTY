import { 
  AuthenticatedMedusaRequest, 
  MedusaResponse 
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/utils"
import ReviewsService from "../../../../../modules/reviews/service"
import { REVIEWS_MODULE } from "../../../../../modules/reviews"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const reviewsService: ReviewsService = req.scope.resolve(REVIEWS_MODULE)
  const productId = req.params.id

  const [reviews, count] = await reviewsService.listAndCountReviews({
    product_id: productId
  }, {
    order: { created_at: "DESC" },
    take: 20,
    skip: 0 // Simple pagination P0
  })

  // Calculate simple stats (in-memory for P0, optimize with SQL later if high scale)
  // For precise avg, we might need a separate aggregation query or store it.
  // Medusa DML doesn't expose easy aggregation yet via standard service.
  // We'll calculate avg based on current batch OR fetch all IDs ratings if needed. 
  // P0 decision: Just return what we have or do a separate count query if possible?
  // Actually, let's just calc avg of *fetched* if count is low, or accept imprecise.
  // BETTER: Fetch ALL ratings only (select rating) to compute avg.
  // const allRatings = await reviewsService.listReviews({ product_id: productId }, { select: ["rating"] })
  // const avg = allRatings.reduce((acc, r) => acc + r.rating, 0) / allRatings.length

  // Let's implement proper avg later. For now, valid Logic.
  
  let avgRating = 0
  if (count > 0) {
      // Optimistic approach: use the fetched reviews if small count, else we need a specialized query.
      // Since specific aggregation is tricky without direct DB access in the route, we will stick to basic listing.
      // Frontend can render "avg" based on loaded reviews or we leave it 0 if we can't compute efficiently.
      // BUT requirement says P0 needs stats. 
      // Workaround: We will fetch all ratings for this product (just 'rating' field).
      const allRatings = await reviewsService.listReviews(
        { product_id: productId }, 
        { select: ["rating"] }
      )
      const sum = allRatings.reduce((acc, r) => acc + (r.rating || 0), 0)
      avgRating = parseFloat((sum / allRatings.length).toFixed(1))
  }

  res.json({
    reviews,
    count,
    avg_rating: avgRating
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const reviewsService: ReviewsService = req.scope.resolve(REVIEWS_MODULE)
  const productId = req.params.id
  // P0: Auth check - Medusa 2.0 treats 'store' routes as public by default unless middleware enforced.
  // We need to check req.auth_context.actor_id or similar.
  
  if (!req.auth_context?.actor_id) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "You must be logged in to leave a review")
  }
  
  const customerId = req.auth_context.actor_id
  const { rating, comment } = req.body as { rating: number; comment?: string }

  // 1. Validation: Check if user bought the product
  const remoteQuery = req.scope.resolve("remoteQuery")
  
  // Use remoteQuery to find if the customer has an order item for this product
  // We check for orders where customer_id matches and items contain a variant of this product
  const query = {
    entry_point: "order",
    fields: ["id", "items.variant.product_id"],
    variables: {
      filters: {
        customer_id: customerId,
        status: ["completed", "fulfilled"], // Usually we want to ensure they received it
      }
    }
  }

  const orders = await remoteQuery(query)
  
  // Check if any order contains an item with the target product_id
  const hasBought = orders.some((order: any) => 
    order.items?.some((item: any) => item.variant?.product_id === productId)
  )

  if (!hasBought) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED, 
      "Вы можете оставить отзыв только после покупки этого товара"
    )
  }
  
  // 2. Check if review exists
  const existing = await reviewsService.listReviews({
      product_id: productId,
      customer_id: customerId
  })
  
  if (existing.length > 0) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "You have already reviewed this product")
  }

  const review = await reviewsService.createReviews({
    product_id: productId,
    customer_id: customerId,
    rating,
    comment
  })

  res.json({ review })
}
