"use client"

import { useState, useMemo } from "react"
import { Text, Button } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { HttpTypes } from "@medusajs/types"
import { useParams, useRouter } from "next/navigation"
import { getLocalizedField } from "@lib/util/localization"
import { useFavorites } from "@lib/context/favorites-context"
import Heart from "@modules/common/icons/heart"
import Spinner from "@modules/common/icons/spinner"
import { addToCart } from "@lib/data/cart"
import { useTranslations } from "next-intl"

import ProductRating from "./rating"
import InstallmentPrice from "./installment"

export default function ProductPreviewContent({
  product,
  isFeatured,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
}) {
  const { locale, countryCode } = useParams()
  const localeStr = String(locale || "ru")
  const countryCodeStr = String(countryCode || "uz")
  const router = useRouter()
  const t = useTranslations("product")
  const { toggleFavorite, isFavorite } = useFavorites()
  const [isAdding, setIsAdding] = useState(false)

  const { cheapestPrice } = getProductPrice({
    product: product,
  })
  
  // Fallback to metadata.price for search results (where calculated_price is not available)
  const metadataPrice = (product as any).metadata?.price || (product as any).price
  const displayPrice = cheapestPrice || (metadataPrice ? {
    calculated_price: metadataPrice.toLocaleString('ru-RU') + ' сум',
    calculated_price_number: metadataPrice,
    original_price: metadataPrice.toLocaleString('ru-RU') + ' сум',
    original_price_number: metadataPrice,
    currency_code: 'UZS',
    price_type: 'default',
    percentage_diff: 0
  } : null)

  const favorite = isFavorite(product.id)

  // Check if product is in stock
  const isInStock = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return true
    }
    return product.variants.some((variant: any) => {
      if (!variant.manage_inventory) return true
      if (variant.allow_backorder) return true
      return (variant.inventory_quantity || 0) > 0
    })
  }, [product.variants])

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (product.variants?.length === 1 && product.variants[0].id) {
      setIsAdding(true)
      try {
        await addToCart({
          variantId: product.variants[0].id,
          quantity: 1,
          countryCode: countryCodeStr,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setIsAdding(false)
      }
    } else {
      router.push(`/${localeStr}/${countryCodeStr}/products/${product.handle}`)
    }
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  return (
    <div className="group block h-full">
      <div 
        data-testid="product-wrapper"
        className={`bg-white rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl relative ${!isInStock ? 'opacity-80' : ''}`}
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

          {/* Favorite Button - Top Right Absolute */}
          <button
            onClick={handleToggleFavorite}
            className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full shadow-md z-20 transition-all duration-200 ${
              favorite ? 'bg-red-50 text-red-600' : 'bg-white/80 text-gray-500 hover:text-red-600 hover:bg-white'
            }`}
          >
            <Heart size={20} fill={favorite ? "currentColor" : "none"} />
          </button>
          
          {!isInStock && (
            <div className="absolute top-2 left-2 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg pointer-events-none z-10">
              Нет в наличии
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between h-full">
          <div>
            {/* Price */}
            <div className="mb-2 h-7 sm:h-8 flex items-center">
              {displayPrice && (
                <PreviewPrice price={displayPrice} isRed={true} />
              )}
            </div>

            {/* Title - Fixed height for 3 lines alignment, line-clamp-3 */}
            <LocalizedClientLink href={`/products/${product.handle}`} className="block mb-2 group-hover:text-red-600 transition-colors">
              <h3 
                className="text-gray-800 text-xs sm:text-sm font-medium leading-[1.4] line-clamp-3 min-h-[4.2em]" 
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                data-testid="product-title"
                title={getLocalizedField(product, "title", localeStr) || product.title}
              >
                {getLocalizedField(product, "title", localeStr) || product.title}
              </h3>
            </LocalizedClientLink>

            {/* Rating */}
            <div className="h-5 mb-1 flex items-center">
              <ProductRating 
                rating={(product.metadata as any)?.rating || 0} 
                reviewCount={(product.metadata as any)?.reviews_count || 0} 
              />
            </div>

            {/* Installment - Conditional based on metadata */}
            <div className="h-6 mb-2">
              {cheapestPrice && (product.metadata as any)?.has_installment && (
                <InstallmentPrice 
                  amount={cheapestPrice.calculated_price_number} 
                  currency_code={cheapestPrice.currency_code} 
                />
              )}
            </div>
          </div>

          {/* Add to Cart Button - Persistent at bottom */}
          <div className="mt-auto">
            <Button
              onClick={handleAddToCart}
              disabled={isAdding || !isInStock}
              className={`w-full h-9 sm:h-10 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isInStock 
                  ? "bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed border-0"
              }`}
            >
              {isAdding ? <Spinner /> : (product.variants?.length === 1 ? t("add_to_cart") : t("select"))}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


