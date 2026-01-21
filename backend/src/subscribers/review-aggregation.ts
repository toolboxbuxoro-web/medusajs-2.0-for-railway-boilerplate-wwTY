import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IReviewModuleService } from "../modules/reviews/types"

export default async function reviewAggregation({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const reviewsModuleService: IReviewModuleService = container.resolve("reviews")
  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

  // 1. Get the review and product
  const review = await reviewsModuleService.retrieveReview(data.id)
  const productId = review.product_id

  // 2. Get all APPROVED reviews for this product
  const approvedReviews = await reviewsModuleService.listReviews(
    { product_id: productId, status: "approved" },
    { select: ["rating"] }
  )

  const count = approvedReviews.length
  let average = 0

  if (count > 0) {
    const total = approvedReviews.reduce((acc, r) => acc + r.rating, 0)
    average = parseFloat((total / count).toFixed(1))
  }

  const distribution = {
    1: approvedReviews.filter((r) => r.rating === 1).length,
    2: approvedReviews.filter((r) => r.rating === 2).length,
    3: approvedReviews.filter((r) => r.rating === 3).length,
    4: approvedReviews.filter((r) => r.rating === 4).length,
    5: approvedReviews.filter((r) => r.rating === 5).length,
  }

  // 3. Update product metadata
  const product = await productService.retrieveProduct(productId)
  const metadata = product.metadata || {}

  metadata.rating_avg = average
  metadata.rating_count = count
  ;(metadata as any).rating_distribution = distribution

  await productService.updateProducts(productId, {
    metadata,
  })

  console.log(
    `[ReviewAggregation] Updated product ${productId}: avg=${average}, count=${count}, distribution=${JSON.stringify(
      distribution
    )}`
  )
}

export const config: SubscriberConfig = {
  event: "review.updated",
}
