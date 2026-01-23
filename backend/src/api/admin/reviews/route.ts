import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import ReviewsService from "../../../modules/reviews/service"

/**
 * GET /admin/reviews
 * List all reviews with filtering and pagination
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { limit = 10, offset = 0, status, product_id } = req.query as any

    // Normalize and validate pagination
    const rawLimit = Number.parseInt(String(limit), 10)
    const rawOffset = Number.parseInt(String(offset), 10)

    const safeLimit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 100)
        : 10

    const safeOffset =
      Number.isFinite(rawOffset) && rawOffset >= 0
        ? rawOffset
        : 0

    const filter: any = {}

    if (status) {
      const allowedStatuses = ["pending", "approved", "rejected", "hidden"]

      if (!allowedStatuses.includes(String(status))) {
        res.status(400).json({
          message: "Invalid status filter. Must be one of: pending, approved, rejected, hidden.",
        })
        return
      }

      filter.status = status
    }

    // Validate product_id format if provided
    if (product_id) {
      if (typeof product_id !== "string" || product_id.trim().length === 0) {
        res.status(400).json({
          message: "Invalid product_id format.",
        })
        return
      }
      filter.product_id = product_id.trim()
    }

    // Get reviews using query API
    const { data: reviews, metadata: { count } } = await query.graph({
      entity: "review",
      fields: [
        "id",
        "rating",
        "title",
        "comment",
        "pros",
        "cons",
        "images",
        "status",
        "rejection_reason",
        "admin_response",
        "admin_response_at",
        "created_at",
        "updated_at",
        "product_id",
        "customer_id",
        "order_id",
      ],
      filters: filter,
      pagination: {
        skip: safeOffset,
        take: safeLimit,
        order: { created_at: "DESC" },
      },
    })

    // Enrich reviews with product and customer data
    const productService = req.scope.resolve(Modules.PRODUCT)
    const customerService = req.scope.resolve(Modules.CUSTOMER)

    const enrichedReviews = await Promise.all(
      reviews.map(async (review: any) => {
        let product = null
        let customer = null

        try {
          if (review.product_id) {
            const products = await productService.listProducts({ id: [review.product_id] })
            product = products[0] || null
          }
        } catch (e) {
          // Product might be deleted
        }

        try {
          if (review.customer_id) {
            const customers = await customerService.listCustomers({ id: [review.customer_id] })
            customer = customers[0] || null
          }
        } catch (e) {
          // Customer might be deleted
        }

        return {
          ...review,
          product: product
            ? {
                id: product.id,
                title: product.title,
                thumbnail: product.thumbnail,
              }
            : null,
          customer: customer
            ? {
                id: customer.id,
                first_name: customer.first_name,
                last_name: customer.last_name,
                email: customer.email,
              }
            : null,
        }
      })
    )

    res.json({
      reviews: enrichedReviews,
      count,
      limit: safeLimit,
      offset: safeOffset,
    })
  } catch (error: any) {
    console.error(`[GET /admin/reviews] Error:`, error)
    res.status(500).json({
      message: "Failed to fetch reviews",
    })
  }
}
