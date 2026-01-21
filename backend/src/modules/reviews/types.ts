import { Review } from "./models/review"

/**
 * Centralized set of allowed review statuses so we don't duplicate
 * string literals across the codebase.
 */
export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden"

export interface ReviewDTO {
  id: string
  product_id: string
  customer_id: string
  order_id: string
  rating: number
  comment?: string | null
  status: ReviewStatus
  created_at: Date
  updated_at: Date
}

export interface CreateReviewDTO {
  product_id: string
  customer_id: string
  /**
   * For production we always expect a review to be tied to a concrete order.
   * This is enforced by the stricter Store API flow that checks canReview.
   */
  order_id: string
  rating: number
  comment?: string | null
  /**
   * When omitted, the module will use its default status (currently "approved").
   * Admin flows can explicitly pass other statuses such as "pending" or "rejected".
   */
  status?: ReviewStatus
}

export interface IReviewModuleService {
  createReviews(data: CreateReviewDTO): Promise<ReviewDTO>
  listReviews(
    filters?: any,
    config?: any
  ): Promise<ReviewDTO[]>
  listAndCountReviews(
    filters?: any,
    config?: any
  ): Promise<[ReviewDTO[], number]>
  retrieveReview(id: string, config?: any): Promise<ReviewDTO>
}
