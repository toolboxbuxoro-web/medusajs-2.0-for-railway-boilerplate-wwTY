"use client"

import { HttpTypes } from "@medusajs/types"
import { useInfiniteProducts } from "@lib/hooks/use-infinite-products"
import ProductPreviewContent from "@modules/products/components/product-preview/content"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

interface InfiniteProductsProps {
  countryCode: string
  locale: string
}

export default function InfiniteProducts({
  countryCode,
  locale,
}: InfiniteProductsProps) {
  const {
    products,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMoreRef,
  } = useInfiniteProducts({
    initialOffset: 0,
    countryCode,
    pageSize: 12,
  })

  // Initial loading state
  if (isLoading && products.length === 0) {
    return (
      <div className="w-full">
        <SkeletonProductGrid />
      </div>
    )
  }

  // Error state
  if (error && products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
        >
          {locale === 'ru' ? 'Попробовать снова' : 'Qayta urinib ko\'ring'}
        </button>
      </div>
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 italic">
          {locale === 'ru' ? 'Товары не найдены' : 'Mahsulotlar topilmadi'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-8 w-full">
      {/* Products Grid */}
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((product) => (
          <li key={product.id}>
            <ProductPreviewContent product={product} isFeatured={false} />
          </li>
        ))}
      </ul>

      {/* Loading more skeleton */}
      {isLoadingMore && (
        <div className="w-full">
          <SkeletonProductGrid />
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="h-10 w-full flex justify-center py-4"
          aria-label="Load more products"
        >
          {/* Intersection observer target - invisible */}
        </div>
      )}

      {/* End of list message */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">
            {locale === 'ru' 
              ? 'Все товары загружены' 
              : 'Barcha mahsulotlar yuklandi'}
          </p>
        </div>
      )}
    </div>
  )
}
