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

  // Use Query to get reviews with related product and customer info
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
      "product.title",
      "product.thumbnail",
      "customer.phone",
      "customer.first_name",
      "customer.last_name"
    ],
    filters: filter,
    pagination: {
      skip: parseInt(offset),
      take: parseInt(limit),
      order: { created_at: "DESC" },
    },
  })

  res.json({
    reviews,
    count,
    limit: parseInt(limit),
    offset: parseInt(offset),
  })
}
