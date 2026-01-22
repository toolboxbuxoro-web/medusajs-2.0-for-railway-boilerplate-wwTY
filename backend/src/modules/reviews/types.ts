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
  pros?: string | null
  cons?: string | null
  images?: string[] | null
  rejection_reason?: string | null
  status: ReviewStatus
  created_at: Date
  updated_at: Date
}

export interface CreateReviewDTO {
  product_id: string
  customer_id: string
  order_id: string
  rating: number
  comment?: string | null
  pros?: string | null
  cons?: string | null
  images?: string[] | null
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
