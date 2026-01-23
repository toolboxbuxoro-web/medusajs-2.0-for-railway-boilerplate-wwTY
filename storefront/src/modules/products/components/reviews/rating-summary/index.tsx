"use client"

import React from "react"
import { clx } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import StarIcon from "@modules/common/icons/star"
import DistributionBars from "./distribution-bars"

interface RatingSummaryProps {
  averageRating: number
  count: number
  distribution: Record<number, number>
  onRatingClick?: (rating: number) => void
  selectedRating?: number
}

const RatingSummary: React.FC<RatingSummaryProps> = ({
  averageRating,
  count,
  distribution,
  onRatingClick,
  selectedRating,
}) => {
  const t = useTranslations("product")

  const handleScroll = () => {
    const reviewsSection = document.getElementById("reviews")
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  const roundedRating = Math.round(averageRating)

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Average Score - Clickable */}
        <button
          onClick={handleScroll}
          className="flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl min-w-[140px] sm:min-w-[180px] hover:from-gray-100 hover:to-gray-200 transition-all duration-200 group border border-gray-200"
        >
          <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
            {averageRating > 0 ? averageRating.toFixed(1) : "—"}
          </div>
          <div className="flex items-center gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                size={20}
                className={clx(
                  "transition-colors",
                  i < roundedRating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-200"
                )}
              />
            ))}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">
            {count > 0 ? (
              <>
                {count} {count === 1 ? t("review_single") : count < 5 ? t("reviews_few") : t("reviews_many")}
              </>
            ) : (
              t("no_reviews_title")
            )}
          </div>
          <div className="mt-2 text-[10px] text-gray-400 group-hover:text-red-600 transition-colors">
            {t("view_all_reviews") || "Смотреть все"}
          </div>
        </button>

        {/* Distribution Bars */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-3 justify-center">
          {[5, 4, 3, 2, 1].map((star) => {
            const starCount = distribution[star] || 0
            const percentage = count > 0 ? (starCount / count) * 100 : 0
            const isSelected = selectedRating === star

            return (
              <button
                key={star}
                onClick={() => onRatingClick?.(star)}
                className={clx(
                  "flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-all duration-200",
                  "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
                  isSelected && "bg-red-50 border border-red-200"
                )}
              >
                <div className="flex items-center gap-1 min-w-[40px] sm:min-w-[50px]">
                  <span className="text-sm sm:text-base font-semibold text-gray-700">
                    {star}
                  </span>
                  <StarIcon
                    size={14}
                    className="text-yellow-400 fill-yellow-400"
                  />
                </div>
                <div className="flex-1 h-2 sm:h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={clx(
                      "h-full rounded-full transition-all duration-500",
                      isSelected ? "bg-red-600" : "bg-yellow-400"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="min-w-[35px] sm:min-w-[40px] text-right">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {starCount}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RatingSummary
