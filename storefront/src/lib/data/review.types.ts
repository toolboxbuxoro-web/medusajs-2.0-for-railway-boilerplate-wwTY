export interface Review {
  id: string
  product_id: string
  customer_id: string
  order_id: string
  rating: number
  comment?: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export interface CreateReviewPayload {
  product_id: string
  rating: number
  comment?: string
}

export interface CanReviewResponse {
  can_review: boolean
  order_id?: string
  reason?: "already_reviewed" | "no_completed_order"
}
