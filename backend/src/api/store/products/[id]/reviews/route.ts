import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import ReviewsService from "../../../../../modules/reviews/service"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const { limit = 10, offset = 0, sort: rawSort = "newest" } = req.query as any

  // Normalize and clamp pagination parameters to avoid pathological
  // values that could lead to excessive load.
  const rawLimit = Number.parseInt(String(limit), 10)
  const rawOffset = Number.parseInt(String(offset), 10)

  const safeLimit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, 50)
      : 10

  const safeOffset =
    Number.isFinite(rawOffset) && rawOffset >= 0
      ? rawOffset
      : 0

  // Clean sort parameter (handle cache-busting suffix like "newest:1" → "newest")
  const sort = typeof rawSort === "string" ? rawSort.split(":")[0] : "newest"

  const reviewsModuleService: ReviewsService = req.scope.resolve("reviewsModuleService")

  const order = sort === "rating_desc" ? { rating: "DESC" } : { created_at: "DESC" }

  // Only return approved reviews
  const [reviews, count] = await reviewsModuleService.listAndCountReviews(
    { product_id: id, status: "approved" },
    {
      take: safeLimit,
      skip: safeOffset,
      order,
    }
  )

  // Prefer aggregated rating metadata maintained by the review aggregation
  // subscriber. This avoids scanning all reviews on each product page load.
  const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
  const product = await productService.retrieveProduct(id)
  const metadata = (product?.metadata || {}) as any

  let average_rating: number
  let distribution: Record<number, number>

  if (typeof metadata.rating_avg === "number") {
    average_rating = metadata.rating_avg
    distribution = (metadata.rating_distribution || {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }) as Record<number, number>
  } else {
    // Fallback path for legacy products where metadata wasn't yet populated.
    // This performs a one-off scan but keeps behavior backwards compatible.
    const allApproved = await reviewsModuleService.listReviews(
      { product_id: id, status: "approved" },
      { select: ["rating"] }
    )

    const totalRating = allApproved.reduce((acc, curr) => acc + curr.rating, 0)
    average_rating =
      allApproved.length > 0
        ? parseFloat((totalRating / allApproved.length).toFixed(1))
        : 0

    distribution = {
      1: allApproved.filter((r) => r.rating === 1).length,
      2: allApproved.filter((r) => r.rating === 2).length,
      3: allApproved.filter((r) => r.rating === 3).length,
      4: allApproved.filter((r) => r.rating === 4).length,
      5: allApproved.filter((r) => r.rating === 5).length,
    }
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

  if (!product_id) {
    return res.status(400).json({ error: "Product id is required" })
  }

  const numericRating = Number(rating)

  if (
    Number.isNaN(numericRating) ||
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return res.status(400).json({
      error: "Rating must be an integer between 1 and 5",
    })
  }

  const reviewsModuleService: ReviewsService = req.scope.resolve("reviewsModuleService")

  // Use the service method for validation
  const eligibility = await reviewsModuleService.canReview(product_id, customerId)

  if (!eligibility.can_review) {
    const status =
      eligibility.reason === "already_reviewed"
        ? 400
        : 403

    let errorMessage = "You can only review products from completed orders"

    if (eligibility.reason === "already_reviewed") {
      errorMessage = "You have already reviewed this product"
    } else if (eligibility.reason === "no_completed_order") {
      errorMessage = "You can only review products you have purchased"
    }

    return res.status(status).json({
      error: errorMessage,
      can_review: false,
      reason: eligibility.reason,
    })
  }

  // 3. Create review
  const review = await reviewsModuleService.createReviews({
    product_id,
    customer_id: customerId,
    order_id: eligibility.order_id!,
    rating: numericRating,
    comment,
    status: "pending"
  })

  res.status(201).json({ review })
}
