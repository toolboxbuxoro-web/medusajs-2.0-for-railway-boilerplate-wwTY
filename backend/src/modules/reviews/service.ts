import { MedusaService, Modules } from "@medusajs/framework/utils"
import { Review } from "./models/review"
import { IEventBusModuleService, MedusaContainer } from "@medusajs/framework/types"
import type { ReviewStatus } from "./types"

class ReviewsService extends MedusaService({
  Review,
}) {
  protected container_: MedusaContainer

  constructor(container: MedusaContainer) {
    super(...arguments)
    this.container_ = container
  }

  protected get eventBus_(): IEventBusModuleService {
    return this.container_.resolve(Modules.EVENT_BUS) as IEventBusModuleService
  }

  /**
   * Create a review and emit event for aggregation.
   * Use this instead of createReviews() directly.
   */
  async createReviewWithEvent(data: any) {
    const reviewId = data.product_id ? `${data.product_id}-${data.customer_id}` : "unknown"
    console.log(`[ReviewsService.createReviewWithEvent] Creating review for product ${data.product_id}, customer ${data.customer_id}`)
    
    try {
      const review = await this.createReviews(data)
      
      // Get the review ID (handle both single and array responses)
      const actualReviewId = Array.isArray(review) ? review[0]?.id : (review as any)?.id
      
      if (!actualReviewId) {
        console.error(`[ReviewsService.createReviewWithEvent] Failed to get review ID after creation:`, {
          review,
          isArray: Array.isArray(review),
          data
        })
        return review
      }
      
      console.log(`[ReviewsService.createReviewWithEvent] Review created with ID: ${actualReviewId}`)
      
      try {
        await this.eventBus_.emit({
          name: "review.created",
          data: { id: actualReviewId },
        })
        console.log(`[ReviewsService.createReviewWithEvent] Event 'review.created' emitted for review ${actualReviewId}`)
      } catch (eventError: any) {
        console.error(`[ReviewsService.createReviewWithEvent] Failed to emit event for review ${actualReviewId}:`, {
          error: eventError.message,
          stack: eventError.stack
        })
        // Don't fail the whole operation if event emission fails
      }
      
      return review
    } catch (error: any) {
      console.error(`[ReviewsService.createReviewWithEvent] Failed to create review:`, {
        error: error.message,
        stack: error.stack,
        productId: data.product_id,
        customerId: data.customer_id
      })
      throw error
    }
  }

  /**
   * Check if a customer can review a product.
   * 
   * Simplified logic:
   * 1. User must be logged in (customerId required)
   * 2. User must have purchased the product in a COMPLETED order
   * 3. User hasn't already reviewed this product (no active review)
   * 
   * Works with multiple products in a single order - each product
   * can be reviewed independently after the order is completed.
   */
  async canReview(productId: string, customerId: string) {
    console.log(`[ReviewsService.canReview] Checking eligibility for product ${productId}, customer ${customerId}`)
    
    if (!productId || !customerId) {
      console.warn(`[ReviewsService.canReview] Missing required parameters:`, { productId, customerId })
      return {
        can_review: false,
        reason: "no_completed_order",
      }
    }

    try {
      // 1. Check if user already has an active review (approved or pending)
      const [existingReviews] = await this.listAndCountReviews({
        product_id: productId,
        customer_id: customerId,
        status: ["approved", "pending"]
      })
      
      console.log(`[ReviewsService.canReview] Found ${existingReviews.length} existing review(s) for product ${productId}, customer ${customerId}`)
      
      if (existingReviews.length > 0) {
        console.log(`[ReviewsService.canReview] Customer ${customerId} already reviewed product ${productId}`)
        return {
          can_review: false,
          reason: "already_reviewed",
        }
      }

      // 2. Check for eligible order using SQL (query.graph doesn't return payment_status reliably)
      const pgConnection = this.container_.resolve("__pg_connection__")

      if (!pgConnection) {
        console.error(`[ReviewsService.canReview] PostgreSQL connection not available`)
        return {
          can_review: false,
          reason: "no_completed_order",
        }
      }

      console.log(`[ReviewsService.canReview] Querying database for eligible orders...`)

      // Simplified query - check if order is completed and contains the product
      // Using order_item.product_id directly (Medusa 2.0 schema)
      const result = await pgConnection.raw(`
        SELECT DISTINCT o.id as order_id
        FROM "order" o
        JOIN order_item oi ON o.id = oi.order_id
        WHERE o.customer_id = ?
          AND oi.product_id = ?
          AND o.status = 'completed'
        LIMIT 1
      `, [customerId, productId])

      console.log(`[ReviewsService.canReview] Query result:`, result?.rows)

      const eligibleOrder = result?.rows?.[0]

      if (eligibleOrder?.order_id) {
        console.log(`[ReviewsService.canReview] Found eligible order ${eligibleOrder.order_id} for product ${productId}, customer ${customerId}`)
        return {
          can_review: true,
          order_id: eligibleOrder.order_id,
        }
      }

      console.log(`[ReviewsService.canReview] No eligible order found for product ${productId}, customer ${customerId}`)
      return {
        can_review: false,
        reason: "no_completed_order",
      }
    } catch (error: any) {
      console.error(`[ReviewsService.canReview] Error for product ${productId}, customer ${customerId}:`, {
        error: error.message,
        stack: error.stack,
        sqlError: error.code,
        sqlState: error.sqlState
      })
      return {
        can_review: false,
        reason: "no_completed_order",
      }
    }
  }

  async approveReview(id: string) {
    return await this.updateReviewStatus(id, "approved")
  }

  async rejectReview(id: string, reason?: string) {
    return await this.updateReviewStatus(id, "rejected", reason)
  }

  async getProductReviews(productId: string) {
    return await this.listReviews({ product_id: productId, status: "approved" })
  }

  async updateReviewStatus(
    id: string,
    status: ReviewStatus,
    rejection_reason?: string
  ) {
    console.log(`[ReviewsService.updateReviewStatus] Updating review ${id} to status: ${status}${rejection_reason ? ` (reason: ${rejection_reason.substring(0, 50)}...)` : ""}`)
    
    try {
      const updateData: any = { id, status }
      if (rejection_reason) {
        updateData.rejection_reason = rejection_reason
      }
      
      const review = await this.updateReviews(updateData)

      if (!review) {
        console.error(`[ReviewsService.updateReviewStatus] Failed to update review ${id} - updateReviews returned null/undefined`)
        throw new Error(`Failed to update review ${id}`)
      }

      try {
        await this.eventBus_.emit({
          name: "review.updated",
          data: { id },
        })
        console.log(`[ReviewsService.updateReviewStatus] Event 'review.updated' emitted for review ${id}`)
      } catch (eventError: any) {
        console.error(`[ReviewsService.updateReviewStatus] Failed to emit event for review ${id}:`, {
          error: eventError.message,
          stack: eventError.stack
        })
        // Don't fail the whole operation if event emission fails
      }

      return review
    } catch (error: any) {
      console.error(`[ReviewsService.updateReviewStatus] Failed to update review ${id}:`, {
        error: error.message,
        stack: error.stack,
        status,
        hasRejectionReason: !!rejection_reason
      })
      throw error
    }
  }
}

export default ReviewsService
