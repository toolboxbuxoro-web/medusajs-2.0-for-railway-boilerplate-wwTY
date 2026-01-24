import { MedusaService, Modules } from "@medusajs/framework/utils"
import { IEventBusModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Review } from "./models/review"
import type {
  ReviewDTO,
  CreateReviewDTO,
  UpdateReviewDTO,
  ReviewEligibility,
  ReviewStatus,
  IReviewModuleService,
} from "./types"

class ReviewsService extends MedusaService({
  Review,
}) {
  protected container_: MedusaContainer

  constructor(container: MedusaContainer) {
    // @ts-ignore - MedusaService handles constructor
    super(...arguments)
    this.container_ = container
  }

  protected get eventBus_(): IEventBusModuleService {
    return this.container_.resolve(Modules.EVENT_BUS) as IEventBusModuleService
  }

  /**
   * Create a review with validation and emit event
   */
  async createReviewWithValidation(data: CreateReviewDTO): Promise<ReviewDTO> {
    // Validate rating
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5")
    }

    // Validate text fields length
    if (data.comment && data.comment.length > 2000) {
      throw new Error("Comment must be 2000 characters or less")
    }
    if (data.pros && data.pros.length > 500) {
      throw new Error("Pros must be 500 characters or less")
    }
    if (data.cons && data.cons.length > 500) {
      throw new Error("Cons must be 500 characters or less")
    }
    if (data.title && data.title.length > 200) {
      throw new Error("Title must be 200 characters or less")
    }

    // Validate images
    if (data.images && data.images.length > 5) {
      throw new Error("Maximum 5 images allowed")
    }

    // Prepare data for MedusaService
    const preparedData: any = {
      ...data,
      status: data.status || "pending",
    }

    // @ts-ignore - MedusaService method signature
    const result = await super.createReviews([preparedData])
    const review = Array.isArray(result) ? result[0] : result

    // Convert images
    const reviewDTO: ReviewDTO = {
      ...review,
      images: Array.isArray(review.images) 
        ? review.images 
        : (review.images ? Object.values(review.images as Record<string, string>) : null),
    } as ReviewDTO

    // Emit event
    try {
      await this.eventBus_.emit({
        name: "review.created",
        data: { id: reviewDTO.id },
      })
    } catch (error: any) {
      console.error(`[ReviewsService] Failed to emit review.created event:`, error)
    }

    return reviewDTO
  }

  /**
   * Update review with validation and emit event
   */
  async updateReviewWithValidation(id: string, data: UpdateReviewDTO): Promise<ReviewDTO> {
    // Validate rating if provided
    if (data.rating !== undefined) {
      if (data.rating < 1 || data.rating > 5) {
        throw new Error("Rating must be between 1 and 5")
      }
    }

    // Validate text fields length
    if (data.comment && data.comment.length > 2000) {
      throw new Error("Comment must be 2000 characters or less")
    }
    if (data.pros && data.pros.length > 500) {
      throw new Error("Pros must be 500 characters or less")
    }
    if (data.cons && data.cons.length > 500) {
      throw new Error("Cons must be 500 characters or less")
    }
    if (data.title && data.title.length > 200) {
      throw new Error("Title must be 200 characters or less")
    }

    // Validate images
    if (data.images && data.images.length > 5) {
      throw new Error("Maximum 5 images allowed")
    }

    // @ts-ignore - MedusaService method signature
    const review = await super.updateReviews({ id, ...data })

    // Convert images
    const reviewDTO: ReviewDTO = {
      ...review,
      images: Array.isArray(review.images) 
        ? review.images 
        : (review.images ? Object.values(review.images as Record<string, string>) : null),
    } as ReviewDTO

    // Emit event
    try {
      await this.eventBus_.emit({
        name: "review.updated",
        data: { id: reviewDTO.id },
      })
    } catch (error: any) {
      console.error(`[ReviewsService] Failed to emit review.updated event:`, error)
    }

    return reviewDTO
  }

  /**
   * List reviews with proper type conversion
   */
  async listReviewsWithConversion(filters?: any, config?: any): Promise<ReviewDTO[]> {
    // @ts-ignore - MedusaService method signature
    const reviews = await super.listReviews(filters, config)
    return reviews.map(review => ({
      ...review,
      images: Array.isArray(review.images) 
        ? review.images 
        : (review.images ? Object.values(review.images as Record<string, string>) : null),
    })) as ReviewDTO[]
  }

  /**
   * List and count reviews with proper type conversion
   */
  async listAndCountReviewsWithConversion(
    filters?: any,
    config?: any
  ): Promise<[ReviewDTO[], number]> {
    // @ts-ignore - MedusaService method signature
    const [reviews, count] = await super.listAndCountReviews(filters, config)
    const convertedReviews = reviews.map(review => ({
      ...review,
      images: Array.isArray(review.images) 
        ? review.images 
        : (review.images ? Object.values(review.images as Record<string, string>) : null),
    })) as ReviewDTO[]
    return [convertedReviews, count]
  }

  /**
   * Retrieve review with proper type conversion
   */
  async retrieveReviewWithConversion(id: string, config?: any): Promise<ReviewDTO> {
    // @ts-ignore - MedusaService method signature
    const review = await super.retrieveReview(id, config)
    return {
      ...review,
      images: Array.isArray(review.images) 
        ? review.images 
        : (review.images ? Object.values(review.images as Record<string, string>) : null),
    } as ReviewDTO
  }

  /**
   * Check if a customer can review a product
   * 
   * Requirements:
   * 1. Customer must be authenticated
   * 2. Customer must have received the product (order.status === "completed")
   * 3. Customer hasn't already reviewed this product (no active review)
   */
  async canReview(
    productId: string,
    customerId: string,
    sharedConnection?: any
  ): Promise<ReviewEligibility> {
    if (!productId || !customerId) {
      return {
        can_review: false,
        reason: "auth_required",
      }
    }

    try {
      const pgConnection = sharedConnection || this.container_.resolve("__pg_connection__")

      // 1. Check for existing reviews
      const [existingReviews] = await this.listAndCountReviewsWithConversion({
        product_id: productId,
        customer_id: customerId,
        status: ["approved", "pending"],
      })

      if (existingReviews.length > 0) {
        return {
          can_review: false,
          reason: "already_reviewed",
        }
      }

      // 2. Canonical check for PURCHASE (order exists)
      const purchaseQuery = `
        SELECT 
          o.id as order_id, 
          o.status as order_status,
          oi.delivered_quantity
        FROM "order" o
        JOIN order_item oi ON oi.order_id = o.id
        JOIN order_line_item oli ON oli.id = oi.item_id
        WHERE
          o.customer_id = $1
          AND oli.product_id = $2
          AND o.status != 'canceled'
        LIMIT 1;
      `
      
      const purchaseResult = await pgConnection.raw(purchaseQuery, [customerId, productId])
      const purchaseRow = purchaseResult.rows[0]

      if (!purchaseRow) {
        return {
          can_review: false,
          reason: "not_purchased",
        }
      }

      // 3. Strict check for DELIVERY
      const isDelivered = 
        Number(purchaseRow.delivered_quantity) > 0 || 
        purchaseRow.order_status === 'completed'

      // DEBUG LOG
      console.log("[Review Eligibility]", {
        customer: customerId,
        product: productId,
        order: purchaseRow.order_id,
        status: purchaseRow.order_status,
        delivered_qty: purchaseRow.delivered_quantity,
        is_delivered: isDelivered
      })

      if (isDelivered) {
        return {
          can_review: true,
          reason: "ok",
          order_id: purchaseRow.order_id
        }
      }

      return {
        can_review: false,
        reason: "not_delivered",
      }

    } catch (error: any) {
      console.error(`[ReviewsService.canReview] Error:`, error)
      return {
        can_review: false,
        reason: "error",
      }
    }
  }

  /**
   * Approve a review
   */
  async approveReview(id: string): Promise<ReviewDTO> {
    return await this.updateReviewStatus(id, "approved")
  }

  /**
   * Reject a review
   */
  async rejectReview(id: string, reason?: string): Promise<ReviewDTO> {
    return await this.updateReviewStatus(id, "rejected", reason)
  }

  /**
   * Update review status and emit event
   */
  protected async updateReviewStatus(
    id: string,
    status: ReviewStatus,
    rejection_reason?: string
  ): Promise<ReviewDTO> {
    const updateData: UpdateReviewDTO = { status }
    if (rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    return await this.updateReviewWithValidation(id, updateData)
  }

  /**
   * Add admin response to a review
   */
  async addAdminResponse(reviewId: string, response: string): Promise<ReviewDTO> {
    if (!response || response.trim().length === 0) {
      throw new Error("Admin response cannot be empty")
    }

    if (response.length > 2000) {
      throw new Error("Admin response must be 2000 characters or less")
    }

    return await this.updateReviewWithValidation(reviewId, {
      admin_response: response.trim(),
      admin_response_at: new Date(),
    })
  }
}

export default ReviewsService
