"use client"

import React from "react"

const ReviewSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start gap-3 sm:gap-4 mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-200" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3.5 h-3.5 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Title Skeleton */}
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />

      {/* Pros Skeleton */}
      <div className="h-4 w-full bg-gray-100 rounded-lg mb-2" />

      {/* Comment Skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-4/6 bg-gray-200 rounded" />
      </div>

      {/* Images Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default ReviewSkeleton
