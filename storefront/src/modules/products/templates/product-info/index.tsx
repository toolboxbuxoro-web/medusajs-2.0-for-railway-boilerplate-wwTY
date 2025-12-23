"use client"

import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { useTranslations } from 'next-intl'
import { useParams } from "next/navigation"
import FavoriteButton from "@modules/products/components/favorite-button"
import ProductSpecs from "@modules/products/components/product-specs"
import ProductFeatures from "@modules/products/components/product-features"
import ProductUseCases from "@modules/products/components/product-use-cases"
import { getLocalizedField } from "@lib/util/localization"
import { parseProductMetadata } from "@modules/products/types/product-metadata"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const t = useTranslations('product')
  const { locale } = useParams()
  const localeStr = String(locale || "ru")
  
  // Parse structured metadata with safe defaults
  const metadata = parseProductMetadata(product.metadata)
  
  // Fallback warranty from legacy field if not in structured
  const warrantyYears = metadata.specifications?.["Гарантия"] || 
    (product.metadata as any)?.warranty as string || null

  return (
    <div id="product-info" className="space-y-4">
      {/* Title */}
      <Heading
        level="h1"
        className="text-xl sm:text-2xl font-bold leading-tight text-gray-900"
        data-testid="product-title"
      >
        {getLocalizedField(product, "title", localeStr) || product.title}
      </Heading>

      {/* Short Description (Above Fold) */}
      {metadata.short_description && (
        <Text className="text-gray-600 text-sm sm:text-base leading-relaxed">
          {metadata.short_description}
        </Text>
      )}

      {/* Product Code & Brand Row */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {metadata.brand && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {metadata.brand}
          </span>
        )}
        <span className="text-gray-500">
          {t('code')}: <span className="text-gray-700">{(product.metadata as any)?.code || product.id.slice(0, 8)}</span>
        </span>
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
        {/* Professional Badge */}
        {metadata.professional_level === "профессиональный" && (
          <div className="inline-flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
            <span>PRO</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 py-2">
        <FavoriteButton productId={product.id} />
      </div>

      {/* Features (Above Fold - First 4) */}
      {metadata.features.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <ProductFeatures features={metadata.features} maxItems={4} showTitle={false} />
        </div>
      )}

      {/* Specifications */}
      <div className="pt-2 border-t border-gray-100">
        <ProductSpecs product={product} maxItems={6} />
      </div>

      {/* Use Cases */}
      {metadata.use_cases.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <ProductUseCases useCases={metadata.use_cases} showTitle={true} />
        </div>
      )}

      {/* Description */}
      {(getLocalizedField(product, "description", localeStr) || product.description) && (
        <div className="pt-2 border-t border-gray-100">
          <Text className="text-gray-600 text-sm leading-relaxed">
            {getLocalizedField(product, "description", localeStr) || product.description}
          </Text>
        </div>
      )}
    </div>
  )
}

export default ProductInfo

