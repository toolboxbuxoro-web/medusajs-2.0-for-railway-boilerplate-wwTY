"use client"

import React from "react"

interface DistributionBarsProps {
  distribution: Record<number, number>
  total: number
  onRatingClick?: (rating: number) => void
  selectedRating?: number
}

const DistributionBars: React.FC<DistributionBarsProps> = ({
  distribution,
  total,
  onRatingClick,
  selectedRating,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {[5, 4, 3, 2, 1].map((star) => {
        const starCount = distribution[star] || 0
        const percentage = total > 0 ? (starCount / total) * 100 : 0
        const isSelected = selectedRating === star

        return (
          <button
            key={star}
            onClick={() => onRatingClick?.(star)}
            className={`
              flex items-center gap-3 p-2 rounded-lg transition-all
              ${isSelected ? "bg-red-50" : "hover:bg-gray-50"}
            `}
          >
            <span className="text-sm font-semibold text-gray-700 min-w-[30px]">
              {star} ★
            </span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isSelected ? "bg-red-600" : "bg-yellow-400"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 min-w-[30px] text-right">
              {starCount}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default DistributionBars
