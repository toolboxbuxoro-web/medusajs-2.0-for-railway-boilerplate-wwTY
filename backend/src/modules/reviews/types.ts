/**
 * Review status types
 */
export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden"

/**
 * Review DTO interface
 */
export interface ReviewDTO {
  id: string
  product_id: string
  customer_id: string
  order_id: string
  rating: number
  title?: string | null
  comment?: string | null
  pros?: string | null
  cons?: string | null
  images?: string[] | null
  status: ReviewStatus
  rejection_reason?: string | null
  admin_response?: string | null
  admin_response_at?: Date | null
  created_at: Date
  updated_at: Date
  deleted_at?: Date | null
}

/**
 * Create review DTO
 */
export interface CreateReviewDTO {
  product_id: string
  customer_id: string
  order_id: string
  rating: number
  title?: string | null
  comment?: string | null
  pros?: string | null
  cons?: string | null
  images?: string[] | null
  status?: ReviewStatus
}

/**
 * Update review DTO
 */
export interface UpdateReviewDTO {
  rating?: number
  title?: string | null
  comment?: string | null
  pros?: string | null
  cons?: string | null
  images?: string[] | null
  status?: ReviewStatus
  rejection_reason?: string | null
  admin_response?: string | null
  admin_response_at?: Date | null
}

/**
 * Review eligibility check result
 */
export interface ReviewEligibility {
  can_review: boolean
  reason?: "already_reviewed" | "not_purchased" | "not_delivered" | "ok" | "auth_required" | "error"
  order_id?: string
}

/**
 * Review module service interface
 */
export interface IReviewModuleService {
  createReviewWithValidation(data: CreateReviewDTO): Promise<ReviewDTO>
  updateReviewWithValidation(id: string, data: UpdateReviewDTO): Promise<ReviewDTO>
  listReviewsWithConversion(filters?: any, config?: any): Promise<ReviewDTO[]>
  listAndCountReviewsWithConversion(
    filters?: any,
    config?: any
  ): Promise<[ReviewDTO[], number]>
  retrieveReviewWithConversion(id: string, config?: any): Promise<ReviewDTO>
  canReview(
    productId: string,
    customerId: string,
    sharedConnection?: any
  ): Promise<ReviewEligibility>
  approveReview(id: string): Promise<ReviewDTO>
  rejectReview(id: string, reason?: string): Promise<ReviewDTO>
  addAdminResponse(reviewId: string, response: string): Promise<ReviewDTO>
}
