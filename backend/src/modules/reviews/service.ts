import { MedusaService, ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Review } from "./models/review"
import { IEventBusModuleService, MedusaContainer, IProductModuleService } from "@medusajs/framework/types"
import type { ReviewStatus } from "./types"

class ReviewsService extends MedusaService({
  Review,
}) {
  protected eventBus_: IEventBusModuleService
  protected container_: MedusaContainer

  constructor(container: { eventBusModuleService: IEventBusModuleService } & MedusaContainer) {
    super(...arguments)
    this.eventBus_ = container.eventBusModuleService
    this.container_ = container as MedusaContainer
  }

  async canReview(productId: string, customerId: string) {
    const query = this.container_.resolve(ContainerRegistrationKeys.QUERY)
    
    // 1. Check if user already reviewed
    const [reviews] = await this.listAndCountReviews({
      product_id: productId,
      customer_id: customerId
    })
    
    if (reviews.length > 0) {
      return {
        can_review: false,
        reason: "already_reviewed",
      }
    }

    // 2. Check for at least one "completed" order with this product
    // We intentionally fetch a bit wider set of fields and then apply
    // stricter business logic in-code to decide what we consider
    // a "completed purchase".
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "status", "payment_status", "fulfillment_status"],
      filters: {
        customer_id: customerId,
        items: {
          variant: {
            product_id: productId
          }
        }
      }
    })

    const eligibleOrder = (orders || []).find((o: any) =>
      this.isOrderCompleted(o)
    )

    if (eligibleOrder) {
      return {
        can_review: true,
        order_id: eligibleOrder.id,
      }
    }

    return {
      can_review: false,
      // Normalized reason used across store API and storefront.
      reason: "no_completed_order",
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

    // Emit domain event so that aggregation/subscribers can react
    await this.eventBus_.emit({
      name: "review.updated",
      data: { id },
    })

    return review
  }

  /**
   * Business definition of "completed purchase" for the purpose of
   * allowing reviews. We keep this logic local so it can be evolved
   * without changing the API surface.
   */
  private isOrderCompleted(order: any): boolean {
    if (!order) {
      return false
    }

    // Base status must be "completed"
    const statusOk = order.status === "completed"

    // If payment / fulfillment statuses exist, they should represent a
    // successful flow. We keep this slightly permissive to avoid
    // unexpected blocking in case of custom states, but still guard
    // obvious non-completed ones.
    const nonCompletedPaymentStatuses = ["requires_action", "canceled"]
    const nonCompletedFulfillmentStatuses = ["not_fulfilled", "canceled"]

    const paymentOk =
      !order.payment_status ||
      !nonCompletedPaymentStatuses.includes(order.payment_status)

    const fulfillmentOk =
      !order.fulfillment_status ||
      !nonCompletedFulfillmentStatuses.includes(order.fulfillment_status)

    return Boolean(statusOk && paymentOk && fulfillmentOk)
  }
}

export default ReviewsService
