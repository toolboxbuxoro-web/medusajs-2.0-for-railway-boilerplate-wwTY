import React from "react"
import { Review } from "@lib/data/review.types"
import { formatRating, formatReviewDate } from "@lib/util/review.formatters"
import StarIcon from "@modules/common/icons/star"
import { Badge, clx } from "@medusajs/ui"

type ReviewCardProps = {
  review: Review
  locale: string
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, locale }) => {
  const isPending = review.status === "pending"
  const customerName = "Покупатель" // Note: In v2, we might not have customer name directly in review object without join
  const initials = customerName.charAt(0).toUpperCase()

  return (
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
          
          {review.comment && (
            <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewCard
