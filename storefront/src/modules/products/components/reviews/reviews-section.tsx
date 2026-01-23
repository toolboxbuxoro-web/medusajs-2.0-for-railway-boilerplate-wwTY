"use client"

import React, { useState } from "react"
import { useInfiniteReviews } from "@lib/hooks/use-infinite-reviews"
import ReviewsList from "./reviews-list"
import RatingSummary from "./rating-summary"
import ReviewsFilters from "./filters"
import AddReviewForm from "./add-review/form"
import AuthModal from "@modules/account/components/auth-modal"
import { useAuth } from "@lib/context/auth-context"
import { Review } from "@lib/data/review.types"
import { useTranslations } from "next-intl"

type ReviewsSectionProps = {
  productId: string
  locale: string
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  productId,
  locale,
}) => {
  const t = useTranslations("product")
  
  // useAuth должен быть вызван безусловно (правило хуков)
  let authStatus: "loading" | "authorized" | "unauthorized" = "unauthorized"
  let isLoggedIn = false
  
  try {
    const auth = useAuth()
    authStatus = auth?.authStatus || "unauthorized"
    isLoggedIn = authStatus === "authorized"
  } catch (error) {
    // Если AuthProvider не доступен, используем значение по умолчанию
    console.warn("[ReviewsSection] AuthProvider not available, using default")
  }
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Проверка productId
  if (!productId) {
    console.error("[ReviewsSection] productId is required")
    return null
  }

  const {
    reviews,
    total,
    averageRating,
    distribution,
    isLoading,
    isLoadingMore,
    hasMore,
    filters,
    sort,
    setFilters,
    setSort,
    refresh,
    loadMoreRef,
  } = useInfiniteReviews({
    productId,
  })

  const handleReviewSuccess = (newReview: Review) => {
    // Optimistic update: refresh reviews to show the new one
    refresh()
  }

  const handleRatingClick = (rating: number) => {
    // Toggle rating filter
    setFilters({
      ...filters,
      rating: filters?.rating === rating ? undefined : rating,
    })
  }

  // Гарантируем, что distribution всегда объект
  const safeDistribution = distribution && typeof distribution === "object" 
    ? distribution 
    : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  return (
    <div
      id="reviews"
      className="pt-12 sm:pt-16 mt-12 sm:mt-16 border-t border-gray-100"
    >
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t("reviews_title")}
        </h2>
        {total > 0 && (
          <p className="text-sm sm:text-base text-gray-500">
            {total}{" "}
            {total === 1
              ? t("review_single")
              : total < 5
              ? t("reviews_few")
              : t("reviews_many")}
          </p>
        )}
      </div>

      {/* Rating Summary */}
      {!isLoading && total > 0 && (
        <div className="mb-6 sm:mb-8">
          <RatingSummary
            averageRating={averageRating || 0}
            count={total || 0}
            distribution={safeDistribution}
            onRatingClick={handleRatingClick}
            selectedRating={filters?.rating}
          />
        </div>
      )}

      {/* Main Content: Filters + Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
        {/* Filters Sidebar (Desktop) */}
        {!isLoading && total > 0 && (
          <div className="hidden lg:block">
            <ReviewsFilters
              filters={filters || {}}
              sort={sort || "newest"}
              onFiltersChange={setFilters}
              onSortChange={setSort}
              total={total || 0}
            />
          </div>
        )}

        {/* Reviews List */}
        <div className="min-w-0">
          <ReviewsList
            reviews={reviews}
            locale={locale}
          />
          
          {/* Loading State & Infinite Scroll Sentinel */}
          {(isLoading || isLoadingMore || hasMore) && (
             <div ref={loadMoreRef} className="py-8 flex justify-center w-full">
               {(isLoading || isLoadingMore) && (
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
               )}
             </div>
          )}
        </div>
      </div>

      {/* Filters (Mobile) */}
      {!isLoading && total > 0 && (
        <div className="lg:hidden mt-6">
          <ReviewsFilters
            filters={filters || {}}
            sort={sort || "newest"}
            onFiltersChange={setFilters}
            onSortChange={setSort}
            total={total || 0}
          />
        </div>
      )}

      {/* Add Review Form */}
      <AddReviewForm
        productId={productId}
        isLoggedIn={isLoggedIn}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onSuccess={handleReviewSuccess}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false)
          refresh()
        }}
      />
    </div>
  )
}

export default ReviewsSection
