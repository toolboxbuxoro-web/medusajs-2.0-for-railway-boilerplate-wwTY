"use client"

import React from "react"
import { Heading, Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const ReviewsEmptyState: React.FC = () => {
  const t = useTranslations("product")

  return (
    <div className="py-12 sm:py-16 flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 sm:mb-6 border-2 border-dashed border-gray-200">
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <Heading level="h2" className="text-gray-900 mb-2 text-lg sm:text-xl">
        {t("no_reviews_title")}
      </Heading>
      <Text className="text-gray-500 text-sm sm:text-base max-w-md">
        {t("no_reviews_text")}
      </Text>
    </div>
  )
}

export default ReviewsEmptyState
