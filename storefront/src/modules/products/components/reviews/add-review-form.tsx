"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createReview, checkCanReview } from "@lib/data/review.service"
import { Review } from "@lib/data/review.types"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import StarIcon from "@modules/common/icons/star"
import { useTranslations } from "next-intl"

interface AddReviewFormProps {
  productId: string
  onSuccess: (review: Review) => void
  isLoggedIn: boolean
  onLoginClick: () => void
}

type EligibilityReason = "already_reviewed" | "no_completed_order" | "error" | null

const AddReviewForm: React.FC<AddReviewFormProps> = ({
  productId,
  onSuccess,
  isLoggedIn,
  onLoginClick,
}) => {
  const t = useTranslations("product")
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const [canReview, setCanReview] = useState<boolean | null>(null)
  const [eligibilityReason, setEligibilityReason] = useState<EligibilityReason>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchEligibility = useCallback(async () => {
    if (!isLoggedIn) return
    setIsLoading(true)
    try {
      const res = await checkCanReview(productId)
      setCanReview(res.can_review)
      setEligibilityReason(res.reason || null)
    } catch (err) {
      setCanReview(false)
      setEligibilityReason("error")
      setError(t("review_error"))
    } finally {
      setIsLoading(false)
    }
  }, [productId, isLoggedIn, t])

  useEffect(() => {
    fetchEligibility()
  }, [fetchEligibility])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError(t("select_rating"))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const review = await createReview({
        product_id: productId,
        rating,
        comment,
      })
      
      setSuccess(true)
      onSuccess(review)
      setComment("")
      setRating(0)
    } catch (err: any) {
      setError(err.message || t("review_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 rounded-3xl p-8 text-center mt-12 border border-dashed border-gray-200">
        <Heading level="h2" className="text-gray-900 mb-4">{t("write_review")}</Heading>
        <Text className="text-gray-500 mb-6">{t("only_buyers_can_review")}</Text>
        <Button 
          variant="primary" 
          className="bg-gray-900 rounded-2xl px-8 h-12"
          onClick={onLoginClick}
        >
          {t("login_or_register")}
        </Button>
      </div>
    )
  }

  if (isLoading) return null

  if (canReview === false && !success) {
    const getMessageKey = (): "already_reviewed" | "only_after_purchase" | "review_error" => {
      if (eligibilityReason === "already_reviewed") {
        return "already_reviewed"
      }
      if (eligibilityReason === "no_completed_order") {
        return "only_after_purchase"
      }
      if (eligibilityReason === "error") {
        return "review_error"
      }
      return "only_after_purchase"
    }

    return (
      <div className="bg-gray-50 rounded-3xl p-8 text-center mt-12 border border-gray-100">
        <Heading level="h2" className="text-gray-900 mb-3">
          {t("write_review")}
        </Heading>
        <Text className="text-gray-500">
          {t(getMessageKey())}
        </Text>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-green-50/50 rounded-3xl p-8 text-center mt-12 border border-green-100">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          ✓
        </div>
        <Heading level="h2" className="text-gray-900 mb-2">{t("review_sent")}</Heading>
        <Text className="text-gray-600">{t("review_sent_text")}</Text>
      </div>
    )
  }

  return (
    <div className="mt-12 p-8 bg-gray-50 rounded-[40px] border border-gray-100">
      <Heading level="h2" className="text-2xl font-bold text-gray-900 mb-2">{t("leave_review")}</Heading>
      <Text className="text-gray-500 mb-8">{t("share_experience")}</Text>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Star Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">{t("your_rating")} *</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform active:scale-95"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              >
                <StarIcon
                  size={32}
                  className={clx(
                    "transition-colors",
                    star <= (hover || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-bold text-gray-900">
                {rating === 5 ? t("rating_excellent") : rating === 4 ? t("rating_good") : rating === 3 ? t("rating_normal") : rating === 2 ? t("rating_bad") : t("rating_terrible")}
              </span>
            )}
          </div>
        </div>

        {/* Comment Field */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">{t("comment")}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-gray-200 p-4 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400 text-[15px]"
            placeholder={t("comment_placeholder")}
          />
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full md:w-auto px-12 h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {isSubmitting ? t("submitting") : t("submit_review")}
        </Button>
      </form>
    </div>
  )
}

export default AddReviewForm
