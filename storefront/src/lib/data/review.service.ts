import { Review, CreateReviewPayload, CanReviewResponse } from "./review.types"

function backendBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
}

export const getReviews = async (
  productId: string,
  { limit = 10, offset = 0, sort = "newest" }: { limit?: number; offset?: number; sort?: string } = {}
): Promise<{ 
  reviews: Review[]; 
  total: number; 
  average_rating: number;
  distribution: Record<number, number>;
}> => {
  const resp = await fetch(
    `${backendBaseUrl()}/store/products/${productId}/reviews?limit=${limit}&offset=${offset}&sort=${sort}`,
    {
      next: { tags: ["reviews"] },
    }
  )

  if (!resp.ok) {
    throw new Error("Failed to fetch reviews")
  }

  return resp.json()
}

/**
 * Check if the current customer can review the product.
 */
export const checkCanReview = async (productId: string): Promise<CanReviewResponse> => {
  const resp = await fetch(`${backendBaseUrl()}/store/products/${productId}/can-review`, {
    headers: {
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
    },
    cache: "no-store",
    credentials: "include", // Send cookies for auth
  })

  if (!resp.ok) {
    return { can_review: false }
  }

  return resp.json()
}

/**
 * Submit a new review for a product.
 */
export const createReview = async (payload: CreateReviewPayload): Promise<Review> => {
  const { product_id, ...data } = payload
  const resp = await fetch(`${backendBaseUrl()}/store/products/${product_id}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
    cache: "no-store",
  })

  if (!resp.ok) {
    const errorJson = await resp.json().catch(() => ({}))
    throw new Error(errorJson.message || errorJson.error || "Failed to create review")
  }

  const { review } = await resp.json()
  return review
}
