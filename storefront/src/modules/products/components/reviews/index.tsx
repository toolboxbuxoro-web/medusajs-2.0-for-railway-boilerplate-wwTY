"use client"

import React, { useState } from "react"
import { useProductReviews } from "@lib/hooks/use-product-reviews"
import ReviewsList from "./reviews-list"
import ProductRatingSummary from "./product-rating-summary"
import AddReviewForm from "./add-review-form"
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
  locale
}) => {
  const t = useTranslations("product")
  const { authStatus } = useAuth()
  const isLoggedIn = authStatus === "authorized"
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  
  const {
    reviews,
    count,
    averageRating,
    distribution,
    isLoading,
    error,
    setReviews,
    setCount,
  } = useProductReviews(productId)

  const handleReviewSuccess = (newReview: Review) => {
    // Optimistic update: add the pending review to the top
    setReviews(prev => [newReview, ...prev])
    setCount(prev => prev + 1)
  }

  return (
    <div className="pt-16 mt-16 border-t border-gray-100 max-w-[1000px] mx-auto" id="reviews">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">{t("reviews_title")}</h2>
      
      {/* Summary Block */}
      {!isLoading && !error && (
        <ProductRatingSummary 
          averageRating={averageRating} 
          count={count} 
          distribution={distribution} 
        />
      )}

      {error && (
        <div className="mt-4 mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("review_error")}
        </div>
      )}

      {/* Reviews List */}
      <ReviewsList reviews={reviews} locale={locale} />

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
        }}
      />
    </div>
  )
}

export default ReviewsSection
