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
      // 1. Check if user already has an active review (approved or pending)
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

      // 2. Check for eligible order (purchased and shipped/fulfilled/completed)
      const pgConnection = sharedConnection || this.container_.resolve("__pg_connection__")

      if (!pgConnection) {
        return {
          can_review: false,
          reason: "not_purchased",
        }
      }

      /**
       * Medusa 2.0 Order Schema:
       * "order" (o) -> order_item (oi) -> order_line_item (oli)
       * Note: order_item.item_id links to order_line_item.id
       */
      const query = `
        SELECT DISTINCT o.id as order_id
        FROM "order" o
        JOIN order_item oi ON o.id = oi.order_id
        JOIN order_line_item oli ON oi.item_id = oli.id
        WHERE o.customer_id = $1
          AND oli.product_id = $2
          AND o.status != 'canceled'
          AND (
            oi.shipped_quantity > 0 
            OR oi.fulfilled_quantity > 0 
            OR o.status = 'completed'
          )
        LIMIT 1
      `

      const result = await pgConnection.raw(query, [customerId, productId])
      const rows = result?.rows || []
      const eligibleOrder = rows[0]

      if (eligibleOrder?.order_id) {
        return {
          can_review: true,
          order_id: eligibleOrder.order_id,
          reason: "ok",
        }
      }

      return {
        can_review: false,
        reason: "not_purchased",
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
