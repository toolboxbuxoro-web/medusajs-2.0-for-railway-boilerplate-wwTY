"use client"

import React from "react"

const OrdersSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
        >
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-1">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-100 rounded-md" />
          </div>

          {/* Date Skeleton */}
          <div className="h-4 w-24 bg-gray-100 rounded mb-3" />

          {/* Summary Skeleton */}
          <div className="h-4 w-full bg-gray-50 rounded mb-4" />

          {/* Footer Skeleton */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-5 w-28 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrdersSkeleton
