"use client"

import { Container } from "@medusajs/ui"

const SkeletonProductPreview = () => {
  return (
    <div className="group block h-full animate-pulse">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col">
        {/* Image Skeleton with shimmer */}
        <div className="relative overflow-hidden">
          <Container className="aspect-[3/4] w-full bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded-lg" />
          {/* Badge skeleton */}
          <div className="absolute top-2 left-2 w-12 h-5 bg-gray-200 rounded-full" />
        </div>

        {/* Content Skeleton */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Title skeleton - 2 lines */}
          <div className="space-y-2 mb-2">
            <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded w-full" />
            <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded w-3/4" />
          </div>
          
          {/* Spacer */}
          <div className="flex-1 min-h-[1rem]" />
          
          {/* Price skeleton */}
          <div className="flex items-baseline gap-2 mt-2">
            <div className="h-6 w-24 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-shimmer rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonProductPreview
