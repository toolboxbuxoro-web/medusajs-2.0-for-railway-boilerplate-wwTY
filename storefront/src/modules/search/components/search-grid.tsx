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
  <div className="animate-pulse">
    <div className="bg-gray-100 rounded-xl aspect-[3/4] mb-4" />
    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
    <div className="h-4 bg-gray-100 rounded w-1/2" />
  </div>
)

export default function SearchGrid({ items, status, hasMore, loadMore }: SearchGridProps) {
  const { ref, inView } = useInView({
    threshold: 0,
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-8">
        {items.map((product, index) => (
          <div key={product.id}>
            <ProductPreviewContent 
              product={product} 
              isFeatured={index < 8}
            />
          </div>
        ))}
        
        {status === "loading" && 
          [...Array(8)].map((_, i) => (
            <div key={`skeleton-${i}`}>
              <ProductSkeleton />
            </div>
          ))
        }
      </div>

      {hasMore && status !== "loading" && (
        <div ref={ref} className="h-10 w-full" />
      )}
    </div>
  )
}
