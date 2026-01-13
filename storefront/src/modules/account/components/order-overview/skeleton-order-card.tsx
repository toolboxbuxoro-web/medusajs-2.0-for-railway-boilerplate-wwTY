import React from "react"

const SkeletonOrderCard = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="flex flex-col gap-y-4">
        {/* TopRow Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <div className="h-3 w-16 bg-gray-100 rounded"></div>
            <div className="h-5 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 w-20 bg-gray-100 rounded-lg"></div>
        </div>

        {/* MiddleRow Skeleton */}
        <div className="flex items-center gap-x-6 py-3 border-y border-gray-50">
          <div className="flex flex-col gap-y-2">
            <div className="h-2 w-10 bg-gray-50 rounded"></div>
            <div className="h-4 w-28 bg-gray-100 rounded"></div>
          </div>
          <div className="flex flex-col gap-y-2">
            <div className="h-2 w-10 bg-gray-50 rounded"></div>
            <div className="h-4 w-24 bg-gray-100 rounded"></div>
          </div>
        </div>

        {/* Items Skeleton */}
        <div className="flex items-center gap-x-2">
          <div className="flex -space-x-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-12 h-12 rounded-xl border-2 border-white bg-gray-100 flex-shrink-0"></div>
            ))}
          </div>
          <div className="ml-auto h-4 w-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonOrderCard
