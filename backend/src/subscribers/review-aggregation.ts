import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { IReviewModuleService } from "../modules/reviews/types"

export default async function reviewAggregation({
  event: { data, name },
  container,
}: SubscriberArgs<{ id: string }>) {
  const eventId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const reviewId = data.id
  
  console.log(`[ReviewAggregation] Event ${eventId} - Processing ${name} for review ${reviewId}`)

  try {
    const reviewsModuleService: IReviewModuleService = container.resolve("reviews")
    const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

    if (!reviewsModuleService) {
      console.error(`[ReviewAggregation] Event ${eventId} - Reviews service not found in container`)
      return
    }

    if (!productService) {
      console.error(`[ReviewAggregation] Event ${eventId} - Product service not found in container`)
      return
    }

    // 1. Get the review and product
    console.log(`[ReviewAggregation] Event ${eventId} - Retrieving review ${reviewId}...`)
    const review = await reviewsModuleService.retrieveReview(reviewId)
    
    if (!review) {
      console.error(`[ReviewAggregation] Event ${eventId} - Review ${reviewId} not found`)
      return
    }

    const productId = review.product_id
    
    if (!productId) {
      console.error(`[ReviewAggregation] Event ${eventId} - Review ${reviewId} has no product_id`)
      return
    }

    console.log(`[ReviewAggregation] Event ${eventId} - Review ${reviewId} found for product ${productId}, status: ${review.status}`)

    // 2. Get all APPROVED reviews for this product
    console.log(`[ReviewAggregation] Event ${eventId} - Fetching approved reviews for product ${productId}...`)
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

    console.log(`[ReviewAggregation] Event ${eventId} - Calculated metrics for product ${productId}:`, {
      count,
      average,
      distribution
    })

    // 3. Update product metadata
    console.log(`[ReviewAggregation] Event ${eventId} - Retrieving product ${productId}...`)
    const product = await productService.retrieveProduct(productId)
    
    if (!product) {
      console.error(`[ReviewAggregation] Event ${eventId} - Product ${productId} not found`)
      return
    }

    const metadata = product.metadata || {}

    metadata.rating_avg = average
    metadata.rating_count = count
    ;(metadata as any).rating_distribution = distribution

    console.log(`[ReviewAggregation] Event ${eventId} - Updating product ${productId} metadata...`)

    await productService.updateProducts(productId, {
      metadata,
    })

    console.log(
      `[ReviewAggregation] Event ${eventId} - Successfully updated product ${productId}: avg=${average}, count=${count}, distribution=${JSON.stringify(
        distribution
      )}`
    )
  } catch (error: any) {
    console.error(`[ReviewAggregation] Event ${eventId} - Error processing review ${reviewId}:`, {
      error: error.message,
      stack: error.stack,
      eventName: name,
      reviewId: data.id
    })
    // Don't throw - we don't want to break the event system
  }
}

export const config: SubscriberConfig = {
  event: ["review.updated", "review.created"],
}
