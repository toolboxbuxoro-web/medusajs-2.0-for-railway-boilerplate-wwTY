export interface Review {
  id: string
  product_id: string
  customer_id: string
  order_id: string
  rating: number
  title?: string | null
  comment?: string | null
  pros?: string | null      // Marketplace: advantages
  cons?: string | null      // Marketplace: disadvantages
  images?: string[] | null  // Array of image URLs
  status: "pending" | "approved" | "rejected" | "hidden"
  rejection_reason?: string | null
  admin_response?: string | null
  admin_response_at?: string | null
  created_at: string
  updated_at: string
}

export interface CreateReviewPayload {
  product_id: string
  rating: number
  title?: string
  comment?: string
  pros?: string       // Marketplace: advantages
  cons?: string       // Marketplace: disadvantages
  images?: string[]   // Array of image URLs (max 5)
}

export interface CanReviewResponse {
  can_review: boolean
  order_id?: string
  reason?: "already_reviewed" | "no_completed_order" | "auth_required" | "error"
}
