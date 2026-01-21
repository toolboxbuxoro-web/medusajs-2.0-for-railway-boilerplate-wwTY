import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { limit = 10, offset = 0, status, product_id } = req.query as any

  // Normalize and validate pagination to protect the database from
  // unbounded or malformed queries.
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
    const allowedStatuses = ["pending", "approved", "rejected"]

    if (!allowedStatuses.includes(String(status))) {
      res.status(400).json({
        message: "Invalid status filter. Must be one of: pending, approved, rejected.",
      })
      return
    }

    filter.status = status
  }

  if (product_id) filter.product_id = product_id

  // Get reviews (without relations - Review model doesn't have links to Product/Customer)
  const { data: reviews, metadata: { count } } = await query.graph({
    entity: "review",
    fields: [
      "id",
      "rating",
      "comment",
      "status",
      "created_at",
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
              title: product.title,
              thumbnail: product.thumbnail,
            }
          : null,
        // Expose only non-sensitive customer fields in the list view.
        // More detailed information can be retrieved in dedicated endpoints
        // if needed.
        customer: customer
          ? {
              first_name: customer.first_name,
              last_name: customer.last_name,
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
}

