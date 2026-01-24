"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import ProductPreviewContent from "@modules/products/components/product-preview/content"
import { SearchStatus } from "@lib/hooks/use-infinite-search"

interface SearchGridProps {
  items: any[]
  status: SearchStatus
  hasMore: boolean
  loadMore: () => void
}

const ProductSkeleton = () => (
  <div className="animate-pulse w-full">
    <div className="bg-gray-100 rounded-xl aspect-[3/4] mb-4" />
    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-100 rounded w-1/2" />
  </div>
)

export default function SearchGrid({ items, status, hasMore, loadMore }: SearchGridProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "500px", // Preload before reaching bottom
  })

  useEffect(() => {
    if (inView && hasMore && status !== "loading") {
      loadMore()
    }
  }, [inView, hasMore, status, loadMore])

  if (items.length === 0 && status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-xl font-bold mb-2">Ничего не найдено</h3>
        <p className="text-gray-500">Попробуйте изменить запрос</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-y-8 w-full">
      <div 
        className="grid grid-cols-2 md:grid-cols-3 small:grid-cols-4 medium:grid-cols-5 gap-x-3 gap-y-8 small:gap-x-6"
        data-testid="search-results-grid"
      >
        {items.map((product, index) => (
          <div 
            key={product.id} 
            className="w-full"
          >
            <ProductPreviewContent 
              product={product} 
              isFeatured={false}
            />
          </div>
        ))}
        
        {status === "loading" && 
          [...Array(8)].map((_, i) => (
            <ProductSkeleton key={`skeleton-${i}`} />
          ))
        }
      </div>

      {/* Infinite Scroll Trigger */}
      {hasMore && status !== "loading" && (
        <div ref={ref} className="h-10 w-full flex justify-center py-4">
           {/* Optional: Add visible spinner if needed, but skeleton usually handles it */}
        </div>
      )}
    </div>
  )
}
