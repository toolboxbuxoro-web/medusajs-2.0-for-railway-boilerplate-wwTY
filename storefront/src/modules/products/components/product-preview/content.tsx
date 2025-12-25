"use client"

import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import ProductPreviewOverlay from "./overlay"
import { HttpTypes } from "@medusajs/types"
import { useParams } from "next/navigation"
import { getLocalizedField } from "@lib/util/localization"
import { useMemo } from "react"

export default function ProductPreviewContent({
  product,
  isFeatured,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
}) {
  const { locale } = useParams()
  const localeStr = String(locale || "ru")
  const { cheapestPrice } = getProductPrice({
    product: product,
  })

  // Check if product is in stock
  const isInStock = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return true // No variants = assume in stock
    }
    
    // Check if any variant has stock available
    return product.variants.some((variant: any) => {
      // If manage_inventory is false, assume in stock
      if (!variant.manage_inventory) return true
      // If allow_backorder is true, assume in stock
      if (variant.allow_backorder) return true
      // Otherwise check inventory quantity
      return (variant.inventory_quantity || 0) > 0
    })
  }, [product.variants])

  return (
    <div className="group block h-full">
      <div 
        data-testid="product-wrapper"
        className={`bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:border-gray-300 relative ${!isInStock ? 'opacity-80' : ''}`}
      >
        {/* Image Container */}
        <div className={`relative overflow-hidden bg-white ${!isInStock ? 'grayscale-[30%]' : ''}`}>
          <LocalizedClientLink href={`/products/${product.handle}`} className="block w-full h-full">
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="full"
              aspectRatio="3/4"
              fit="contain"
              className="bg-white"
            />
          </LocalizedClientLink>
          
          {!isInStock && (
            <div className="absolute top-2 left-2 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg pointer-events-none">
              Нет в наличии
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Action Overlay - only show if in stock */}
          {isInStock && <ProductPreviewOverlay product={product} />}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Badges Row */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {/* Professional Badge */}
            {(product.metadata as any)?.professional_level === "профессиональный" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                PRO
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mb-2">
            {cheapestPrice && (
              <div className="flex items-baseline gap-2">
                <PreviewPrice price={cheapestPrice} isRed={true} />
              </div>
            )}
          </div>
          
          {/* Title */}
          <LocalizedClientLink href={`/products/${product.handle}`}>
            <h3 
              className="text-gray-800 text-xs sm:text-sm md:text-base font-medium leading-snug line-clamp-3 group-hover:text-red-600 transition-colors" 
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
              data-testid="product-title"
            >
              {getLocalizedField(product, "title", localeStr) || product.title}
            </h3>
          </LocalizedClientLink>
          
          {/* Spacer */}
          <div className="flex-1" />
        </div>
      </div>
    </div>
  )
}

