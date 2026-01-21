import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * Legacy endpoint for creating reviews.
 *
 * This route has been intentionally disabled in favor of the
 * product-scoped flow:
 *   POST /store/products/:id/reviews
 *
 * That flow performs a stricter eligibility check (canReview)
 * and always ties the review to a concrete completed order.
 */
export const POST = async (
  _req: MedusaRequest,
  res: MedusaResponse
) => {
  return res.status(410).json({
    message:
      "POST /store/reviews has been removed. Please use POST /store/products/:id/reviews instead.",
  })
}
