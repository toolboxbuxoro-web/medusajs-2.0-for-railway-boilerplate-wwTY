"use client"

import { HttpTypes } from "@medusajs/types"
import ProductPreviewContent from "@modules/products/components/product-preview/content"

interface SearchProductsSliderProps {
  products: HttpTypes.StoreProduct[]
}

export default function SearchProductsSlider({ products }: SearchProductsSliderProps) {
  if (products.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-8">
      {products.map((product, index) => (
        <div key={product.id}>
          <ProductPreviewContent 
            product={product} 
            isFeatured={index < 8}
          />
        </div>
      ))}
    </div>
  )
}
