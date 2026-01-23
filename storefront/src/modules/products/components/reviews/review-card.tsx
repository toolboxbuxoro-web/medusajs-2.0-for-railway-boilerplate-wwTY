"use client"

import React, { useState } from "react"
import { Review } from "@lib/data/review.types"
import { formatReviewDate } from "@lib/util/review.formatters"
import StarIcon from "@modules/common/icons/star"
import { Badge, clx } from "@medusajs/ui"

type ReviewCardProps = {
  review: Review
  locale: string
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, locale }) => {
  const isPending = review.status === "pending"
  const customerName = "Покупатель"
  const initials = customerName.charAt(0).toUpperCase()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const openLightbox = (url: string) => {
    setSelectedImage(url)
    setLightboxOpen(true)
  }

  return (
    <>
      <div className={clx(
        "py-8 transition-opacity border-b border-gray-50 last:border-0",
        isPending && "opacity-60"
      )}>
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg border border-gray-100 shadow-sm">
            {initials}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{customerName}</span>
                {isPending && (
                  <Badge color="orange" size="small" className="rounded-full px-2 py-0">
                    На модерации
                  </Badge>
                )}
              </div>
              <span className="text-[13px] text-gray-400">
                {formatReviewDate(review.created_at, locale)}
              </span>
            </div>
            
            <div className="flex items-center gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <StarIcon 
                  key={i} 
                  size={14} 
                  className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} 
                />
              ))}
            </div>

            {/* Title */}
            {review.title && (
              <h3 className="font-semibold text-gray-900 text-base mb-2">
                {review.title}
              </h3>
            )}

            {/* Pros */}
            {review.pros && (
              <div className="flex items-start gap-2 mb-2">
                <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                <p className="text-gray-700 text-sm">{review.pros}</p>
              </div>
            )}

            {/* Cons */}
            {review.cons && (
              <div className="flex items-start gap-2 mb-2">
                <span className="text-red-500 flex-shrink-0 mt-0.5">✗</span>
                <p className="text-gray-700 text-sm">{review.cons}</p>
              </div>
            )}
            
            {/* Comment */}
            {review.comment && (
              <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap mt-3">
                {review.comment}
              </p>
            )}

            {/* Images */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {review.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => openLightbox(img)}
                    className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-colors"
                  >
                    <img 
                      src={img} 
                      alt={`Review image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Admin Response */}
            {review.admin_response && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">Ответ администратора</span>
                      {review.admin_response_at && (
                        <span className="text-xs text-gray-400">
                          {formatReviewDate(review.admin_response_at, locale)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.admin_response}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={() => setLightboxOpen(false)}
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
