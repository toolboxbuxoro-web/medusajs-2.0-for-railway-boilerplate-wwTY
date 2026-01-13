"use client"

import React from "react"

const OrderDetailsSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-y-4 animate-pulse">
      {/* Back button and title skeleton */}
      <div className="flex gap-2 justify-between items-center mb-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-6 w-32 bg-gray-100 rounded" />
      </div>

      {/* Main Container Skeleton */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-8">
        {/* Order Info Skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
          <div className="h-4 w-1/2 bg-gray-100 rounded" />
          <div className="flex gap-4">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-100 rounded-md" />
          </div>
        </div>

        {/* Items List Skeleton */}
        <div className="pt-8 border-t border-gray-50 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
                <div className="h-3 w-1/4 bg-gray-50 rounded" />
              </div>
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Shipping/Summary Skeleton */}
        <div className="pt-8 border-t border-gray-50 space-y-6">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-50 rounded" />
            <div className="h-4 w-full bg-gray-50 rounded" />
          </div>
        </div>

        {/* Summary Footer Skeleton */}
        <div className="pt-8 border-t border-gray-50 flex justify-between">
          <div className="h-6 w-24 bg-gray-100 rounded" />
          <div className="h-7 w-32 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsSkeleton
