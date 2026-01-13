import React from "react"
import ReviewCard from "./review-card"
import { Review } from "@lib/data/review.types"
import { Heading, Text } from "@medusajs/ui"

interface ReviewsListProps {
  reviews: Review[]
  locale: string
}

const ReviewsList: React.FC<ReviewsListProps> = ({ reviews, locale }) => {
  if (reviews.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl opacity-20">💬</span>
        </div>
        <Heading level="h2" className="text-gray-900 mb-2">Отзывов пока нет</Heading>
        <Text className="text-gray-500">Станьте первым, кто оставит отзыв об этом товаре!</Text>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-0">
      <div className="py-6 border-b border-gray-100 mb-4">
        <Heading level="h2" className="text-xl font-bold text-gray-900">
          Отзывы покупателей
        </Heading>
      </div>
      <div className="divide-y divide-gray-100">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} locale={locale} />
        ))}
      </div>
    </div>
  )
}

export default ReviewsList
