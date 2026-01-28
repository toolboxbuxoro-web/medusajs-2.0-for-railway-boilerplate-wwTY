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
import RatingSummary from "@modules/products/components/rating-summary"


type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  variant?: "header" | "details" | "full" | "compact"
}

const ProductInfo = ({ product, variant = "full" }: ProductInfoProps) => {
  const t = useTranslations('product')
  const { locale } = useParams()
  const localeStr = String(locale || "ru")
  
  // Parse structured metadata with safe defaults
  const metadata = parseProductMetadata(product.metadata)
  
  // Fallback warranty from legacy field if not in structured
  const warrantyYears = metadata.specifications?.["Гарантия"] || 
    (product.metadata as any)?.warranty as string || null

  const isHeader = variant === "header"
  const isDetails = variant === "details" || variant === "full"
  const isCompact = variant === "compact"

  return (
    <div id="product-info" className={isCompact ? "" : "space-y-6"}>
      {isHeader && (
        <div className="space-y-4">
          <div className="space-y-2">
            {/* Title ONLY for header variant as requested */}
            <Heading
              level="h1"
              className="text-2xl sm:text-4xl font-bold leading-tight text-gray-900 tracking-tight"
              data-testid="product-title"
            >
              {getLocalizedField(product, "title", localeStr) || product.title}
            </Heading>
          </div>

        </div>
      )}

      {isCompact && (
        <div className="flex items-center gap-6 py-2">
          <RatingSummary 
            ratingAvg={metadata.rating_avg} 
            ratingCount={metadata.rating_count} 
          />
          {metadata.brand && (
            <span className="text-gray-400 text-sm">
              {t('brand')}: <span className="text-red-600 font-bold hover:underline cursor-pointer">{metadata.brand}</span>
            </span>
          )}
        </div>
      )}

      {isDetails && (
        <div className="space-y-6">
          {/* Mobile Product Title - shown only on mobile above SKU */}
          <div className="lg:hidden">
            <Heading
              level="h1"
              className="text-xl font-bold leading-tight text-gray-900 tracking-tight mb-4"
              data-testid="product-title-mobile"
            >
              {getLocalizedField(product, "title", localeStr) || product.title}
            </Heading>
          </div>

          {/* Metadata Row for Details section (previously in header) */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm pt-4 border-t border-gray-100">
            {/* Code */}
            <div className="flex flex-col gap-1">
              <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{t('code')}</span>
              <span className="text-gray-900 font-bold text-base">
                {(product.metadata as any)?.code || product.handle}
              </span>
            </div>

            {/* Brand */}
            {product.metadata?.brand && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{t('brand')}</span>
                <span className="text-gray-900 font-semibold text-base">
                  {String(product.metadata.brand)}
                </span>
              </div>
            )}

            {/* Rating */}
            {product.metadata?.rating_avg && Number(product.metadata.rating_avg) > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{t('rating')}</span>
                <RatingSummary 
                  ratingAvg={Number(product.metadata.rating_avg)}
                  ratingCount={Number(product.metadata.rating_count) || 0}
                />
              </div>
            )}

            {/* Warranty Badge */}
            {warrantyYears && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{t('warranty')}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-500 text-white uppercase tracking-wider w-fit">
                   {t('official')}
                </span>
              </div>
            )}
          </div>

          {/* Interaction Bar (Favorite/Share) - Moved to sticky sidebar or top of details */}
          <div className="flex items-center gap-4 py-4 border-y border-gray-50">
            <FavoriteButton productId={product.id} />
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684m0 2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              {t('share')}
            </button>
          </div>

          {/* Features (Above Fold - First 4) */}
          {metadata.features.length > 0 && (
            <ProductFeatures features={metadata.features} maxItems={4} showTitle={true} />
          )}

          {/* Specifications */}
          <div className="pt-6 border-t border-gray-100">
            <ProductSpecs product={product} maxItems={8} />
          </div>

          {/* Use Cases */}
          {metadata.use_cases.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <ProductUseCases useCases={metadata.use_cases} showTitle={true} />
            </div>
          )}

          {/* Description */}
          {(getLocalizedField(product, "description", localeStr) || product.description) && (
            <div className="pt-6 border-t border-gray-100">
              <Heading level="h2" className="text-lg font-bold mb-4">{t('description')}</Heading>
              <Text className="text-gray-600 text-base leading-relaxed">
                {getLocalizedField(product, "description", localeStr) || product.description}
              </Text>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductInfo
