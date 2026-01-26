"use client"

const SkeletonCollectionRail = () => {
  return (
    <div className="mb-6 sm:mb-10">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="hidden sm:block h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex items-center gap-1.5">
            <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Products slider skeleton */}
      <div className="flex gap-x-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[160px] sm:w-[200px]">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Image skeleton */}
              <div className="aspect-[3/4] w-full bg-gray-200 animate-pulse" />
              
              {/* Content skeleton */}
              <div className="p-3 sm:p-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-4" />
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonCollectionRail
