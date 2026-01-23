"use server"

import { getAuthHeaders } from "@lib/data/cookies"
import { revalidateTag } from "next/cache"

function backendBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
}

export async function submitReview(productId: string, data: any) {
  const headers = await getAuthHeaders()
  
  if (!headers || Object.keys(headers).length === 0) {
    throw new Error("Unauthorized")
  }

  const response = await fetch(`${backendBaseUrl()}/store/products/${productId}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      ...headers,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || result.message || "Failed to submit review")
  }

  revalidateTag(`reviews-${productId}`)
  return result.review
}

export async function checkReviewEligibility(productId: string) {
  const headers = await getAuthHeaders()

  // If no auth headers, user is definitely not logged in -> can't review
  if (!headers || Object.keys(headers).length === 0) {
    return { can_review: false, reason: "auth_required" }
  }

  try {
    const response = await fetch(`${backendBaseUrl()}/store/products/${productId}/can-review`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        ...headers,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`[checkReviewEligibility] Failed: ${response.status}`)
      return { can_review: false, reason: "error" }
    }

    return await response.json()
  } catch (error) {
    console.error("[checkReviewEligibility] Error:", error)
    return { can_review: false, reason: "error" }
  }
}
