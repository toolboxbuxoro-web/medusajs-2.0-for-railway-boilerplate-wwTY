"use client"

import { HttpTypes } from "@medusajs/types"
import { useInfiniteCollections } from "@lib/hooks/use-infinite-collections"
import ProductRail from "@modules/home/components/featured-products/product-rail"
import SkeletonCollectionRail from "./skeleton"

interface InfiniteCollectionsProps {
  initialOffset: number
  countryCode: string
  locale: string
  region: HttpTypes.StoreRegion
}

export default function InfiniteCollections({
  initialOffset,
  countryCode,
  locale,
  region,
}: InfiniteCollectionsProps) {
  const {
    collections,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMoreRef,
  } = useInfiniteCollections({
    initialOffset,
    countryCode,
    pageSize: 4,
  })

  // Initial loading state
  if (isLoading && collections.length === 0) {
    return (
      <div className="flex flex-col gap-y-8">
        {[...Array(2)].map((_, i) => (
          <SkeletonCollectionRail key={`skeleton-${i}`} />
        ))}
      </div>
    )
  }

  // Error state
  if (error && collections.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  // Empty state
  if (collections.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 italic">
          {locale === 'ru' ? 'Коллекции не найдены' : 'Kolleksiyalar topilmadi'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-8">
      {/* Render collections */}
      <ul className="flex flex-col gap-y-8 list-none p-0 m-0">
        {collections.map((collection, index) => (
          <li key={collection.id}>
            <ProductRail
              collection={collection as HttpTypes.StoreCollection}
              region={region}
              locale={locale}
              isFirst={index + initialOffset === 0}
            />
          </li>
        ))}
      </ul>

      {/* Loading more skeleton */}
      {isLoadingMore && (
        <div className="flex flex-col gap-y-8">
          {[...Array(2)].map((_, i) => (
            <SkeletonCollectionRail key={`loading-more-${i}`} />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="h-10 w-full flex justify-center py-4"
          aria-label="Load more collections"
        >
          {/* Intersection observer target - invisible */}
        </div>
      )}

      {/* End of list message */}
      {!hasMore && collections.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">
            {locale === 'ru' 
              ? 'Все коллекции загружены' 
              : 'Barcha kolleksiyalar yuklandi'}
          </p>
        </div>
      )}
    </div>
  )
}
