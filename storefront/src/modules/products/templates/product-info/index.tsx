"use client"

import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { useTranslations } from 'next-intl'
import { useParams } from "next/navigation"
import FavoriteButton from "@modules/products/components/favorite-button"
import ProductSpecs from "@modules/products/components/product-specs"
import { getLocalizedProductDescription, getLocalizedProductTitle } from "@lib/util/get-localized-product"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const t = useTranslations('product')
  const { locale } = useParams()
  const localeStr = String(locale || "ru")
  
  const warrantyYears = product.metadata?.warranty as string || null

  return (
    <div id="product-info" className="space-y-4">
      {/* Title */}
      <Heading
        level="h1"
        className="text-xl sm:text-2xl font-bold leading-tight text-gray-900"
        data-testid="product-title"
      >
        {getLocalizedProductTitle(product, localeStr)}
      </Heading>

      {/* Product Code & Rating Row */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-gray-500">
          {t('code')}: <span className="text-gray-700">{(product.metadata?.code as string) || product.id.slice(0, 8)}</span>
        </span>
        
        {/* Placeholder for rating - can be implemented later */}
        {/* <div className="flex items-center gap-1">
          <span className="text-yellow-400">★★★★★</span>
          <span className="text-gray-500">1207 отзывов</span>
        </div> */}
      </div>

      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Warranty Badge */}
        {warrantyYears && (
          <div className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Гарантия производителя {warrantyYears}</span>
          </div>
        )}
        
        {/* Black Friday Badge */}
        {!!product.metadata?.black_friday && (
          <span className="inline-block bg-black text-white text-xs px-2.5 py-1 rounded font-semibold">
            {t('black_friday')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 py-2">
        <FavoriteButton productId={product.id} />
      </div>

      {/* Specifications */}
      <div className="pt-2 border-t border-gray-100">
        <ProductSpecs product={product} maxItems={6} />
      </div>

      {/* Description (collapsible on mobile) */}
      {(product.metadata?.description_uz || product.description) && (
        <div className="pt-4 border-t border-gray-100">
          <Text
            className="text-sm text-gray-600 whitespace-pre-line line-clamp-4"
            data-testid="product-description"
          >
            {getLocalizedProductDescription(product, localeStr)}
          </Text>
        </div>
      )}
    </div>
  )
}

export default ProductInfo
