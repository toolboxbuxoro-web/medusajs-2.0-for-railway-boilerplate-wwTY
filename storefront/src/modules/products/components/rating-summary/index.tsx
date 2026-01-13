"use client"

import React from "react"
import StarIcon from "@modules/common/icons/star"
import { useTranslations } from "next-intl"

interface RatingSummaryProps {
  ratingAvg: number
  ratingCount: number
}

const RatingSummary: React.FC<RatingSummaryProps> = ({ ratingAvg, ratingCount }) => {
  const t = useTranslations("product")

  const handleScroll = () => {
    const reviewsSection = document.getElementById("reviews")
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  const roundedRating = Math.round(ratingAvg)

  return (
    <button
      onClick={handleScroll}
      className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none transition-opacity hover:opacity-80"
      aria-label={`${ratingAvg} stars from ${ratingCount} reviews. Click to see reviews.`}
    >
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            size={16}
            className={i < roundedRating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="font-bold text-gray-900">{ratingAvg.toFixed(1)}</span>
        <span className="text-gray-400 font-normal underline decoration-gray-300 underline-offset-4 group-hover:text-red-600 group-hover:decoration-red-200 transition-all">
          ({ratingCount} {t("reviews")})
        </span>
      </div>
    </button>
  )
}

export default RatingSummary
