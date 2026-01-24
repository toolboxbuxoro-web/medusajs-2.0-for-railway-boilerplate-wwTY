"use client"

import React from "react"
import { Review } from "@lib/data/review.types"
import ReviewCard from "./review-card"
import ReviewSkeleton from "./review-skeleton"
import ReviewsEmptyState from "./empty-state"
import { useInfiniteReviews } from "@lib/hooks/use-infinite-reviews"

interface ReviewsListProps {
  productId: string
  locale: string
  filters?: { rating?: number; withPhotos?: boolean }
  sort?: "newest" | "oldest" | "rating_desc" | "rating_asc"
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  productId,
  locale,
  filters: initialFilters,
  sort: initialSort,
}) => {
  if (!productId || productId === "undefined" || productId === "null") {
    return null
  }

  const {
    reviews,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMoreRef,
  } = useInfiniteReviews({
    productId,
    initialFilters,
    initialSort,
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-700 text-sm font-medium mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-red-600 hover:text-red-700 text-sm underline"
        >
          Обновить страницу
        </button>
      </div>
    )
  }

  // Empty state
  if (!reviews || reviews.length === 0) {
    return <ReviewsEmptyState />
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Reviews */}
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} locale={locale} />
      ))}

      {/* Loading More Skeletons */}
      {isLoadingMore && (
        <>
          <ReviewSkeleton />
          <ReviewSkeleton />
        </>
      )}

      {/* Infinite Scroll Trigger */}
      {hasMore && !isLoadingMore && (
        <div ref={loadMoreRef} className="h-10 w-full" />
      )}

      {/* End of List */}
      {!hasMore && reviews && reviews.length > 0 && (
        <div className="text-center py-6 text-sm text-gray-400">
          Все отзывы загружены
        </div>
      )}
    </div>
  )
}

export default ReviewsList
