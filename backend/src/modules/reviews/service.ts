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
   * Check if a customer can review a product.
   * 
   * Production-ready logic:
   * 1. User must be logged in (customerId required)
   * 2. User must have purchased the product (order exists)
   * 3. Payment must be captured (not just authorized)
   * 4. User hasn't already reviewed this product (no active review)
   */
  async canReview(productId: string, customerId: string) {
    if (!productId || !customerId) {
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
      
      if (existingReviews.length > 0) {
        return {
          can_review: false,
          reason: "already_reviewed",
        }
      }

      // 2. Check for eligible order using SQL (query.graph doesn't return payment_status reliably)
      const pgConnection = this.container_.resolve("__pg_connection__")

      const result = await pgConnection.raw(`
        SELECT DISTINCT o.id as order_id
        FROM "order" o
        JOIN order_payment_collection opc ON o.id = opc.order_id
        JOIN payment_collection pc ON opc.payment_collection_id = pc.id
        JOIN order_item oi ON o.id = oi.order_id
        JOIN product_variant pv ON oi.variant_id = pv.id
        WHERE o.customer_id = ?
          AND pv.product_id = ?
          AND o.status != 'canceled'
          AND (pc.captured_amount > 0 OR pc.status IN ('captured', 'completed'))
        LIMIT 1
      `, [customerId, productId])

      const eligibleOrder = result?.rows?.[0]

      if (eligibleOrder?.order_id) {
        return {
          can_review: true,
          order_id: eligibleOrder.order_id,
        }
      }

      return {
        can_review: false,
        reason: "no_completed_order",
      }
    } catch (error: any) {
      console.error(`[ReviewsService.canReview] Error for product ${productId}, customer ${customerId}:`, error)
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
    const updateData: any = { id, status }
    if (rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }
    
    const review = await this.updateReviews(updateData)

    await this.eventBus_.emit({
      name: "review.updated",
      data: { id },
    })

    return review
  }
}

export default ReviewsService
