"use client"

import { useState, useEffect, useCallback } from "react"
import { getReviews } from "@lib/data/review.service"
import { Review } from "@lib/data/review.types"

export function useProductReviews(productId: string) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [count, setCount] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [distribution, setDistribution] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    if (!productId || productId === "undefined" || productId === "null") {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const data = await getReviews(productId, { limit: 20 })
      setReviews(data.reviews)
      setCount(data.total)
      setAverageRating(data.average_rating)
      setDistribution(data.distribution)
    } catch (err: any) {
      console.error("[useProductReviews] Error:", err)
      setError(err.message || "Failed to fetch reviews")
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    if (productId) {
      fetchReviews()
    }
  }, [productId, fetchReviews])

  return {
    reviews,
    count,
    averageRating,
    distribution,
    isLoading,
    error,
    refresh: fetchReviews,
    setReviews, // For optimistic updates
    setCount,
  }
}
