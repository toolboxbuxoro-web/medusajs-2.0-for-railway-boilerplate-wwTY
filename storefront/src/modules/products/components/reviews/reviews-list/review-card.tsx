"use client"

import React, { useState } from "react"
import { Review } from "@lib/data/review.types"
import { formatReviewDate } from "@lib/util/review.formatters"
import StarIcon from "@modules/common/icons/star"
import { Badge, clx } from "@medusajs/ui"
import { useTranslations } from "next-intl"

type ReviewCardProps = {
  review: Review
  locale: string
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, locale }) => {
  const t = useTranslations("product")
  const isPending = review.status === "pending"
  const customerName = "Покупатель"
  const initials = customerName.charAt(0).toUpperCase()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [expandedImages, setExpandedImages] = useState(false)

  const openLightbox = (url: string) => {
    setSelectedImage(url)
    setLightboxOpen(true)
  }

  const hasImages = review.images && review.images.length > 0
  const imagesToShow = expandedImages ? review.images : review.images?.slice(0, 4) || []
  const remainingImages = hasImages ? (review.images?.length || 0) - 4 : 0

  return (
    <>
      <div
        className={clx(
          "bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 transition-all duration-200",
          "hover:shadow-md hover:border-gray-200",
          isPending && "opacity-60"
        )}
      >
        {/* Header: Avatar, Name, Date, Status */}
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          {/* Avatar */}
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm sm:text-base border border-gray-200 shadow-sm">
            {initials}
          </div>

          {/* Name, Date, Badges */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
              <span className="font-semibold text-gray-900 text-sm sm:text-base">
                {customerName}
              </span>
              
              {/* Verified Purchase Badge */}
              {review.order_id && (
                <Badge
                  color="green"
                  size="small"
                  className="rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium"
                >
                  ✓ Проверенная покупка
                </Badge>
              )}

              {/* Pending Badge */}
              {isPending && (
                <Badge
                  color="orange"
                  size="small"
                  className="rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium"
                >
                  На модерации
                </Badge>
              )}

              {/* Date */}
              <span className="text-[11px] sm:text-xs text-gray-400 ml-auto">
                {formatReviewDate(review.created_at, locale)}
              </span>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  size={14}
                  className={clx(
                    "transition-colors",
                    i < review.rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-200"
                  )}
                />
              ))}
              <span className="ml-1.5 text-xs sm:text-sm font-semibold text-gray-700">
                {review.rating}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        {review.title && (
          <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2 sm:mb-3">
            {review.title}
          </h3>
        )}

        {/* Pros */}
        {review.pros && (
          <div className="flex items-start gap-2 mb-2 sm:mb-3 bg-green-50/50 rounded-xl p-2.5 sm:p-3 border border-green-100">
            <span className="text-green-600 flex-shrink-0 mt-0.5 font-bold text-sm sm:text-base">
              ✓
            </span>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{review.pros}</p>
          </div>
        )}

        {/* Cons */}
        {review.cons && (
          <div className="flex items-start gap-2 mb-2 sm:mb-3 bg-red-50/50 rounded-xl p-2.5 sm:p-3 border border-red-100">
            <span className="text-red-600 flex-shrink-0 mt-0.5 font-bold text-sm sm:text-base">
              ✗
            </span>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{review.cons}</p>
          </div>
        )}

        {/* Comment */}
        {review.comment && (
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-3 sm:mb-4">
            {review.comment}
          </p>
        )}

        {/* Images Grid */}
        {hasImages && (
          <div className="mb-3 sm:mb-4">
            <div
              className={clx(
                "grid gap-2",
                imagesToShow.length === 1 && "grid-cols-1",
                imagesToShow.length === 2 && "grid-cols-2",
                imagesToShow.length >= 3 && "grid-cols-2 sm:grid-cols-3"
              )}
            >
              {imagesToShow.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => openLightbox(img)}
                  className={clx(
                    "relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100",
                    "hover:border-gray-300 transition-all duration-200 group",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  )}
                  aria-label={`Просмотр изображения ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt={`Review image ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </button>
              ))}
              
              {/* Show More Button */}
              {remainingImages > 0 && !expandedImages && (
                <button
                  onClick={() => setExpandedImages(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 flex items-center justify-center text-gray-600 font-medium text-sm sm:text-base"
                >
                  +{remainingImages}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Admin Response */}
        {review.admin_response && (
          <div className="mt-4 pt-4 border-t border-gray-100 bg-blue-50/30 rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs sm:text-sm border border-blue-200">
                A
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                    Ответ администратора
                  </span>
                  {review.admin_response_at && (
                    <span className="text-[10px] sm:text-xs text-gray-400">
                      {formatReviewDate(review.admin_response_at, locale)}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                  {review.admin_response}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр изображения"
        >
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white text-3xl sm:text-4xl hover:text-gray-300 transition-colors z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full hover:bg-white/10"
            onClick={() => setLightboxOpen(false)}
            aria-label="Закрыть"
          >
            ×
          </button>
          <img
            src={selectedImage}
            alt="Review image full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export default ReviewCard
