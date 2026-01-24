"use client"

import React, { useState, useEffect, useCallback } from "react"
import Modal from "@modules/common/components/modal"
import { createReview, checkCanReview } from "@lib/data/review.service"
import StarIcon from "@modules/common/icons/star"
import { Button, clx } from "@medusajs/ui"
import { useAuth } from "@lib/context/auth-context"
import { CanReviewResponse, Review } from "@lib/data/review.types"
import { useTranslations } from "next-intl"

type AddReviewModalProps = {
  isOpen: boolean
  onClose: () => void
  productId: string
  onSuccess: (newReview: Review) => void
}

const AddReviewModal: React.FC<AddReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  onSuccess,
}) => {
  const t = useTranslations("product")
  const { authStatus } = useAuth()
  const isLoggedIn = authStatus === "authorized"
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false)
  const [eligibility, setEligibility] = useState<CanReviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchEligibility = useCallback(async () => {
    if (!isLoggedIn || !isOpen) return

    setIsLoadingEligibility(true)
    try {
      const res = await checkCanReview(productId)
      setEligibility(res)
    } catch (err) {
      console.error("Error checking review eligibility:", err)
      setEligibility(null)
      setError(t("review_error"))
    } finally {
      setIsLoadingEligibility(false)
    }
  }, [productId, isLoggedIn, isOpen, t])

  useEffect(() => {
    fetchEligibility()
  }, [fetchEligibility])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoggedIn) {
      setError(t("only_buyers_can_review"))
      return
    }

    if (!eligibility?.can_review) {
      setError(t("only_after_purchase"))
      return
    }

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

      onSuccess(review)
      onClose()
      setRating(0)
      setComment("")
    } catch (err: any) {
      setError(err.message || t("review_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const getEligibilityMessage = () => {
    if (!isLoggedIn) return t("only_buyers_can_review")
    if (isLoadingEligibility) return t("loading")
    if (eligibility?.can_review) return null
    if (eligibility?.reason === "already_reviewed") return t("already_reviewed")
    if (eligibility?.reason === "not_delivered") return t("only_after_delivery")
    if (eligibility?.reason === "not_purchased") return t("only_after_purchase")
    return t("review_error")
  }

  const eligibilityMessage = getEligibilityMessage()
  const canSubmit = isLoggedIn && eligibility?.can_review && !isSubmitting

  return (
    <Modal isOpen={isOpen} close={onClose} size="small">
      <Modal.Title>{t("leave_review")}</Modal.Title>
      <Modal.Body>
        <form onSubmit={handleSubmit} className="w-full space-y-6 pt-4">
          {eligibilityMessage && !eligibility?.can_review && (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 text-sm">
              {eligibilityMessage}
            </div>
          )}

          <div className={clx(!canSubmit && "opacity-50 pointer-events-none")}>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              {t("your_rating")}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <StarIcon
                    size={32}
                    className={
                      s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div className={clx(!canSubmit && "opacity-50 pointer-events-none")}>
            <label
              htmlFor="review-comment"
              className="text-sm font-medium text-gray-700 mb-2 block"
            >
              {t("comment")}
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none resize-none text-sm"
              placeholder={t("comment_placeholder")}
            />
          </div>

          {error && <p className="text-red-500 text-xs py-1">{error}</p>}

          <div className="pt-4">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!canSubmit}
              className={clx(
                "w-full h-14 bg-red-600 text-white font-semibold rounded-2xl hover:bg-red-700 transition-colors shadow-sm",
                !canSubmit && "bg-gray-200 text-gray-400 hover:bg-gray-200"
              )}
            >
              {isLoggedIn ? t("submit_review") : t("login_or_register")}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  )
}

export default AddReviewModal
