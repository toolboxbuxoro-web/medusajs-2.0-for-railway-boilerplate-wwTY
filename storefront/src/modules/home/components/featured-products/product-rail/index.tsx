import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getLocalizedField } from "@lib/util/localization"
import ProductSlider from "./ProductSlider"

export default function ProductRail({
  collection,
  region,
  locale,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
  locale: string
}) {
  const { products } = collection as HttpTypes.StoreCollection & { products: HttpTypes.StoreProduct[] }

  if (!products || products.length === 0) {
    return null
  }

  const totalCount = products.length
  const collectionTitle = getLocalizedField(collection, "title", locale) || collection.title

  return (
    <div className="mb-10 sm:mb-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
          {collectionTitle}
        </h2>
        
        {/* Right side: View all link + count + arrows */}
        <div className="flex items-center gap-3">
          <LocalizedClientLink 
            href={`/collections/${collection.handle}`}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <span>Посмотреть все</span>
            <span className="text-gray-400">({totalCount})</span>
          </LocalizedClientLink>
          
          {/* Navigation arrows for desktop - controlled by ProductSlider */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button 
              data-slider-prev={collection.id}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Предыдущий"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              data-slider-next={collection.id}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Следующий"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Products Slider */}
      <ProductSlider products={products} totalCount={totalCount} collectionId={collection.id} />
    </div>
  )
}
