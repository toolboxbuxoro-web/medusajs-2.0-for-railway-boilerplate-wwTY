import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export default function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const { products } = collection

  if (!products || products.length === 0) {
    return null
  }

  return (
    <div className="mb-12 sm:mb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="heading-2">{collection.title}</h2>
        <LocalizedClientLink 
          href={`/collections/${collection.handle}`}
          className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
        >
          <span>Смотреть все</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </LocalizedClientLink>
      </div>
      
      {/* Products Grid */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {products.map((product) => (
          <li key={product.id} className="h-full">
            {/* @ts-ignore */}
            <ProductPreview product={product} region={region} isFeatured />
          </li>
        ))}
      </ul>
    </div>
  )
}
