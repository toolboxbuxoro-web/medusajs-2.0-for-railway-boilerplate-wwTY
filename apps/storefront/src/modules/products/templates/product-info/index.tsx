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
  variant?: "header" | "details" | "full"
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

  return (
    <div id="product-info" className="space-y-6">
      {isHeader && (
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
      )}

      {isDetails && (
        <div className="space-y-6">
          {/* Metadata Row for Details section (previously in header) */}
          <div className="flex flex-wrap items-center gap-6 text-sm pt-4 border-t border-gray-100">
             {/* Brand */}
             {metadata.brand && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{t('brand')}</span>
                <span className="text-red-600 font-bold hover:underline cursor-pointer">
                  {metadata.brand}
                </span>
              </div>
            )}
            
            {/* Rating */}
            <div className="flex flex-col gap-1">
              <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{t('rating')}</span>
              <div className="flex items-center gap-1 text-orange-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span className="font-bold text-gray-900">4.8</span>
                <span className="text-gray-400 font-normal">(42 {t('reviews')})</span>
              </div>
            </div>

            {/* Code */}
            <div className="flex flex-col gap-1">
              <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{t('code')}</span>
              <span className="text-gray-900 font-bold">
                {(product.metadata as any)?.code || product.id.slice(0, 8)}
              </span>
            </div>

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
