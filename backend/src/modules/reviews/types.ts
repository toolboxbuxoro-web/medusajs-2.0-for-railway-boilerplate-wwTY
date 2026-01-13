import { Review } from "./models/review"

export interface ReviewDTO {
  id: string
  product_id: string
  customer_id: string
  order_id: string
  rating: number
  comment?: string | null
  status: "pending" | "approved" | "rejected"
  created_at: Date
  updated_at: Date
}

export interface CreateReviewDTO {
  product_id: string
  customer_id: string
  order_id: string
  rating: number
  comment?: string | null
  status?: "pending" | "approved" | "rejected"
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
