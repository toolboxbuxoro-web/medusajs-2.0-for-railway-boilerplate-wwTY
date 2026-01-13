import { MedusaService, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Review } from "./models/review"
import { IEventBusModuleService, MedusaContainer } from "@medusajs/framework/types"

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
    
    if (reviews.length > 0) return { can_review: false, reason: "already_reviewed" }

    // 2. Check for completed/fulfilled order with this product
    // Note: In Medusa 2.0, fulfilled state is often handled via fulfillments, but prompt specifies completed/fulfilled status
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "status"],
      filters: {
        customer_id: customerId,
        status: ["completed", "fulfilled"],
        items: {
          variant: {
            product_id: productId
          }
        }
      }
    })

    if (orders.length > 0) {
      return { can_review: true, order_id: orders[0].id }
    }

    return { can_review: false, reason: "no_completed_order" }
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

  async updateReviewStatus(id: string, status: "approved" | "rejected", rejection_reason?: string) {
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
