"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders } from "./cookies"

export const getCustomerReviews = async () => {
  return sdk.client
    .fetch<{
      pending_items: any[]
      reviews: any[]
      reviews_by_product: Record<string, any>
    }>(`/store/customer/reviews`, {
      method: "GET",
      headers: await getAuthHeaders(),
      next: { tags: ["reviews", "customer_reviews"] },
    })
    .then((res) => res)
    .catch((err) => medusaError(err))
}

export const checkProductReviewEligibility = async (productId: string) => {
  if (!productId || productId === "undefined" || productId === "null") {
    console.warn(`[checkProductReviewEligibility] Invalid productId: ${productId}. Skipping fetch.`)
    return { can_review: false, reason: "error" }
  }

  return sdk.client
    .fetch<{
      can_review: boolean
      reason?: string
    }>(`/store/products/${productId}/can-review`, {
      method: "GET",
      headers: await getAuthHeaders(),
      next: { tags: ["reviews", `eligibility-${productId}`] },
    })
    .then((res) => res)
    .catch((err) => medusaError(err))
}
