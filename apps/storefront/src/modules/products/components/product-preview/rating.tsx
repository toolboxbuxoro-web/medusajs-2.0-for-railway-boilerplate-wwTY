import StarIcon from "@modules/common/icons/star"

export default function ProductRating({ 
  rating = 0, 
  reviewCount = 0 
}: { 
  rating?: number
  reviewCount?: number
}) {
  // Adaptive label for reviews
  const reviewLabel = reviewCount >= 1000 ? "отз." : "отзывов"
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
        <span className="text-[10px] text-gray-400 truncate max-w-[60px]">
          ({reviewCountDisplay} {reviewLabel})
        </span>
      )}
    </div>
  )
}
