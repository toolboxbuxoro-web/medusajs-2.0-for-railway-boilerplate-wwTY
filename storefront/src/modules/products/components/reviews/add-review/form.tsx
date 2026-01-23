"use client"

import React, { useState } from "react"
import { submitReview } from "@modules/products/components/reviews/actions"
import { uploadReviewImages } from "@lib/data/review.service"
import { Review } from "@lib/data/review.types"
import { Button, Heading, Text, clx } from "@medusajs/ui"
import StarIcon from "@modules/common/icons/star"
import { useTranslations } from "next-intl"
import ImageUpload from "./image-upload"
import EligibilityCheck from "./eligibility-check"

interface AddReviewFormProps {
  productId: string
  onSuccess: (review: Review) => void
  isLoggedIn: boolean
  onLoginClick: () => void
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({
  productId,
  onSuccess,
  isLoggedIn,
  onLoginClick,
}) => {
  const t = useTranslations("product")
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [pros, setPros] = useState("")
  const [cons, setCons] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleImageUrlsChange = (urls: string[]) => {
    setImageUrls(urls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError(t("select_rating"))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const review = await submitReview(productId, {
        product_id: productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
        pros: pros.trim() || undefined,
        cons: cons.trim() || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      })

      setSuccess(true)
      onSuccess(review)
      
      // Reset form
      setTitle("")
      setComment("")
      setPros("")
      setCons("")
      setRating(0)
      setImages([])
      setImageUrls([])
    } catch (err: any) {
      console.error(`[AddReviewForm] Failed to create review:`, err)
      setError(err.message || t("review_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center mt-8 sm:mt-12 border border-dashed border-gray-200">
        <Heading level="h2" className="text-gray-900 mb-3 sm:mb-4 text-lg sm:text-xl">
          {t("write_review")}
        </Heading>
        <Text className="text-gray-500 mb-6 text-sm sm:text-base">
          {t("only_buyers_can_review")}
        </Text>
        <Button
          variant="primary"
          className="bg-gray-900 hover:bg-black rounded-xl sm:rounded-2xl px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all"
          onClick={onLoginClick}
        >
          {t("login_or_register")}
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-8 sm:mt-12">
      <EligibilityCheck
        productId={productId}
        onCanReview={() => {}}
        onCannotReview={() => {}}
      >
        {({ canReview, isLoading: eligibilityLoading }) => {
          if (eligibilityLoading) {
            return (
              <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
              </div>
            )
          }

          if (!canReview) {
            return (
              <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center border border-gray-100">
                <Heading level="h2" className="text-gray-900 mb-3 text-lg sm:text-xl">
                  {t("write_review")}
                </Heading>
                <Text className="text-gray-500 text-sm sm:text-base">
                  {t("only_after_delivery")}
                </Text>
              </div>
            )
          }

          if (success) {
            return (
              <div className="bg-green-50/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center border border-green-100">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl sm:text-2xl font-bold">
                  ✓
                </div>
                <Heading level="h2" className="text-gray-900 mb-2 text-lg sm:text-xl">
                  {t("review_sent")}
                </Heading>
                <Text className="text-gray-600 text-sm sm:text-base">
                  {t("review_sent_text")}
                </Text>
              </div>
            )
          }

          return (
            <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-100">
              <Heading level="h2" className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                {t("leave_review")}
              </Heading>
              <Text className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
                {t("share_experience")}
              </Text>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Star Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm sm:text-base font-semibold text-gray-700">
                    {t("your_rating")} *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg"
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(star)}
                        aria-label={`Оценить ${star} звезд`}
                      >
                        <StarIcon
                          size={32}
                          className={clx(
                            "transition-colors",
                            star <= (hover || rating)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-200"
                          )}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm sm:text-base font-bold text-gray-900">
                        {rating === 5
                          ? t("rating_excellent")
                          : rating === 4
                          ? t("rating_good")
                          : rating === 3
                          ? t("rating_normal")
                          : rating === 2
                          ? t("rating_bad")
                          : t("rating_terrible")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm sm:text-base font-semibold text-gray-700">
                    {t("title") || "Заголовок"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={200}
                    className="w-full rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400 text-sm sm:text-[15px]"
                    placeholder={t("title_placeholder") || "Краткое описание вашего отзыва..."}
                  />
                  <span className="text-xs text-gray-400 text-right">
                    {title.length}/200
                  </span>
                </div>

                {/* Pros Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-green-500 text-base sm:text-lg">✓</span>{" "}
                    {t("pros") || "Достоинства"}
                  </label>
                  <input
                    type="text"
                    value={pros}
                    onChange={(e) => setPros(e.target.value)}
                    maxLength={500}
                    className="w-full rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder:text-gray-400 text-sm sm:text-[15px]"
                    placeholder={t("pros_placeholder") || "Что понравилось в товаре?"}
                  />
                  <span className="text-xs text-gray-400 text-right">
                    {pros.length}/500
                  </span>
                </div>

                {/* Cons Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm sm:text-base font-semibold text-gray-700 flex items-center gap-2">
                    <span className="text-red-500 text-base sm:text-lg">✗</span>{" "}
                    {t("cons") || "Недостатки"}
                  </label>
                  <input
                    type="text"
                    value={cons}
                    onChange={(e) => setCons(e.target.value)}
                    maxLength={500}
                    className="w-full rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all placeholder:text-gray-400 text-sm sm:text-[15px]"
                    placeholder={t("cons_placeholder") || "Что не понравилось?"}
                  />
                  <span className="text-xs text-gray-400 text-right">
                    {cons.length}/500
                  </span>
                </div>

                {/* Comment Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm sm:text-base font-semibold text-gray-700">
                    {t("comment") || "Комментарий"}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400 text-sm sm:text-[15px] resize-none"
                    placeholder={t("comment_placeholder") || "Расскажите подробнее о товаре..."}
                  />
                  <span className="text-xs text-gray-400 text-right">
                    {comment.length}/2000
                  </span>
                </div>

                {/* Image Upload */}
                <ImageUpload
                  images={images}
                  imageUrls={imageUrls}
                  onImagesChange={setImages}
                  onImageUrlsChange={handleImageUrlsChange}
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="w-full sm:w-auto px-8 sm:px-12 h-12 sm:h-14 bg-gray-900 hover:bg-black text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-gray-200 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  {isSubmitting ? t("submitting") || "Отправка..." : t("submit_review")}
                </Button>
              </form>
            </div>
          )
        }}
      </EligibilityCheck>
    </div>
  )
}

export default AddReviewForm
