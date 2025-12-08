"use client"

import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import { useTranslations } from 'next-intl'
import { useParams } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FavoriteButton from "@modules/products/components/favorite-button"
import Compare from "@modules/common/icons/compare"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const t = useTranslations('product')
  const { locale } = useParams()

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-3 sm:gap-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
          {!!product.metadata?.black_friday && (
            <span className="inline-block bg-black text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded font-semibold">
              {t('black_friday')}
            </span>
          )}
        </div>

        {/* Title */}
        <Heading
          level="h1"
          className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight"
          data-testid="product-title"
        >
          {/* @ts-ignore */}
          {locale === 'uz' && product.metadata?.title_uz ? product.metadata.title_uz : product.title}
        </Heading>

        {/* Product Code & Rating */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span>{t('code')}: {(product.metadata?.code as string) || product.id.slice(0, 8)}</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-2 sm:mt-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <FavoriteButton productId={product.id} />
          </div>
        </div>

        {/* Description */}
        {(product.metadata?.description_uz || product.description) && (
          <Text
            className="text-sm sm:text-base text-gray-700 whitespace-pre-line mt-2 sm:mt-4 line-clamp-3 sm:line-clamp-none"
            data-testid="product-description"
          >
            {/* @ts-ignore */}
            {locale === 'uz' && product.metadata?.description_uz ? product.metadata.description_uz : product.description}
          </Text>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
