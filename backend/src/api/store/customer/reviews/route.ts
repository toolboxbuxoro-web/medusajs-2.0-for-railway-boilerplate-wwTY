import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import ReviewsService from "../../../../modules/reviews/service"

/**
 * GET /store/customer/reviews
 * Get all reviews for the current customer
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ error: "Authentication required" })
  }

  try {
    const { limit = 10, offset = 0, status } = req.query as any

    // Normalize pagination
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

    const reviewsModuleService: ReviewsService = req.scope.resolve("reviews")

    const filters: any = { customer_id: customerId }
    if (status) {
      const allowedStatuses = ["pending", "approved", "rejected", "hidden"]
      if (allowedStatuses.includes(String(status))) {
        filters.status = status
      }
    }

    const [reviews, count] = await reviewsModuleService.listAndCountReviewsWithConversion(
      filters,
      {
        take: safeLimit,
        skip: safeOffset,
        order: { created_at: "DESC" },
      }
    )

    res.json({
      reviews,
      count,
      limit: safeLimit,
      offset: safeOffset,
    })
  } catch (error: any) {
    console.error("[GET /store/customer/reviews] Error:", error)
    res.status(500).json({ error: "Failed to fetch reviews" })
  }
}
