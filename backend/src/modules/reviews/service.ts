import { MedusaService, ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { Review } from "./models/review"
import { IEventBusModuleService, MedusaContainer, IProductModuleService } from "@medusajs/framework/types"
import type { ReviewStatus } from "./types"

class ReviewsService extends MedusaService({
  Review,
}) {
  protected container_: MedusaContainer

  constructor(container: MedusaContainer) {
    super(...arguments)
    this.container_ = container
  }

  /**
   * Lazy getter for event bus to avoid DI resolution issues in constructor.
   * Resolves via module key so it works in both dev and compiled environments.
   */
  protected get eventBus_(): IEventBusModuleService {
    return this.container_.resolve(Modules.EVENT_BUS) as IEventBusModuleService
  }

  async canReview(productId: string, customerId: string) {
    if (!productId || !customerId) {
      return {
        can_review: false,
        reason: "no_completed_order",
      }
    }

    const query = this.container_.resolve(ContainerRegistrationKeys.QUERY)
    
    try {
      // 1. Check if user already has an active review (approved or pending)
      // Rejected/hidden reviews don't block new reviews - user can submit a new one
      const [existingReviews] = await this.listAndCountReviews({
        product_id: productId,
        customer_id: customerId,
        status: ["approved", "pending"] // Only check active reviews
      })
      
      if (existingReviews.length > 0) {
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

      if (eligibleOrder && eligibleOrder.id) {
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
    } catch (error: any) {
      // Log error but don't expose internal details
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

    // Base status for allowing reviews.
    // В некоторых наших потоках заказ остаётся в status="pending",
    // но при этом уже оплачен и доставлен, поэтому считаем такие
    // заказы тоже подходящими для отзыва.
    const statusOk =
      order.status === "completed" ||
      order.status === "pending"

    // If payment status exists, it should represent a successful flow.
    // Fulfillment мы больше не учитываем, т.к. во многих магазинах
    // заказ считается завершённым после успешной оплаты, а отгрузка
    // может происходить позже (или вообще не использоваться).
    const nonCompletedPaymentStatuses = ["requires_action", "canceled"]

    const paymentOk =
      !order.payment_status ||
      !nonCompletedPaymentStatuses.includes(order.payment_status)

    return Boolean(statusOk && paymentOk)
  }
}

export default ReviewsService
