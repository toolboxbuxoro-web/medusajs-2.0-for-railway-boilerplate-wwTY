import StarIcon from "@modules/common/icons/star"

export default function ProductRating({ 
  rating = 0, 
  reviewCount = 0 
}: { 
  rating?: number
  reviewCount?: number
}) {
  // Get proper plural form for reviews
  const getReviewLabel = (count: number) => {
    if (count >= 1000) return "отз."
    const lastDigit = count % 10
    const lastTwoDigits = count % 100
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "отзывов"
    if (lastDigit === 1) return "отзыв"
    if (lastDigit >= 2 && lastDigit <= 4) return "отзыва"
    return "отзывов"
  }

  const reviewLabel = getReviewLabel(reviewCount)
  const reviewCountDisplay = reviewCount >= 1000 
    ? `${(reviewCount / 1000).toFixed(1)}k` 
    : reviewCount.toString()

  return (
    <div className="flex items-center gap-1">
      <StarIcon 
        size={12} 
        fill="#FACC15"
        color="#FACC15"
      />
      <span className="text-[11px] text-gray-600 font-medium tabular-nums">
        {rating > 0 ? rating.toFixed(1) : "0"}
      </span>
      {reviewCount > 0 && (
        <span className="text-[10px] text-gray-500">
          {reviewCountDisplay} {reviewLabel}
        </span>
      )}
    </div>
  )
}
