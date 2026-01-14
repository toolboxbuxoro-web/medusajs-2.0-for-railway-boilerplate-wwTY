import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  const { limit = 10, offset = 0, status, product_id } = req.query as any
  
  const filter: any = {}
  if (status) filter.status = status
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
      skip: parseInt(offset),
      take: parseInt(limit),
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
        product: product ? { title: product.title, thumbnail: product.thumbnail } : null,
        customer: customer ? { 
          first_name: customer.first_name, 
          last_name: customer.last_name,
          phone: customer.phone 
        } : null,
      }
    })
  )

  res.json({
    reviews: enrichedReviews,
    count,
    limit: parseInt(limit),
    offset: parseInt(offset),
  })
}

