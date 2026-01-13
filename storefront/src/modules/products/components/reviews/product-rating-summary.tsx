import { Heading, Text, clx } from "@medusajs/ui"
import React from "react"

interface ProductRatingSummaryProps {
  averageRating: number
  count: number
  distribution: Record<number, number>
}

const ProductRatingSummary: React.FC<ProductRatingSummaryProps> = ({
  averageRating,
  count,
  distribution,
}) => {
  const ratings = [5, 4, 3, 2, 1]

  return (
    <div className="flex flex-col md:flex-row gap-8 py-6 border-b border-gray-100">
      {/* Average Score */}
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl min-w-[200px]">
        <div className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
        <div className="flex items-center gap-x-1 my-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={clx(
                "text-2xl",
                s <= Math.round(averageRating) ? "text-yellow-400" : "text-gray-200"
              )}
            >
              ★
            </span>
          ))}
        </div>
        <Text className="text-gray-500 text-sm">
          {count} {count === 1 ? "отзыв" : count > 1 && count < 5 ? "отзыва" : "отзывов"}
        </Text>
      </div>

      {/* Distribution Bars */}
      <div className="flex-1 flex flex-col gap-y-2 justify-center">
        {ratings.map((star) => {
          const starCount = distribution[star] || 0
          const percentage = count > 0 ? (starCount / count) * 100 : 0

          return (
            <div key={star} className="flex items-center gap-x-4">
              <div className="flex items-center gap-x-1 min-w-[30px]">
                <span className="text-sm font-medium text-gray-700">{star}</span>
                <span className="text-yellow-400 text-sm">★</span>
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="min-w-[40px] text-right">
                <Text className="text-xs text-gray-500">{starCount}</Text>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProductRatingSummary
