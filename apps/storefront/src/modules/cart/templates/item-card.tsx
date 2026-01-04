"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { updateLineItem } from "@lib/data/cart"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { convertToLocale } from "@lib/util/money"
import { useTranslations } from "next-intl"
import Marquee from "@modules/common/components/marquee"
import { useParams } from "next/navigation"
import { getLocalizedLineItemTitle } from "@lib/util/get-localized-line-item"

type ItemCardProps = {
  item: HttpTypes.StoreCartLineItem
  selected: boolean
  onSelect: () => void
  currencyCode?: string
}

const ItemCard = ({ item, selected, onSelect, currencyCode }: ItemCardProps) => {
  const t = useTranslations("cart")
  const tProduct = useTranslations("product")
  const { locale } = useParams()
  const localeStr = String(locale || "ru")
  const [quantity, setQuantity] = useState(item.quantity)
  const [updating, setUpdating] = useState(false)

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return
    setUpdating(true)
    await updateLineItem({
      lineId: item.id,
      quantity: newQuantity,
    })
    setQuantity(newQuantity)
    setUpdating(false)
  }

  const { handle } = item.variant?.product ?? {}
  const variant = item.variant as any
  const originalPrice = variant?.calculated_price?.calculated_amount || 0
  const productMetadata = variant?.product?.metadata as any
  const discount = productMetadata?.discount_percent 
    ? Math.round((originalPrice * Number(productMetadata.discount_percent)) / 100)
    : 0
  const finalPrice = originalPrice - discount

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex gap-3 sm:gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 hidden sm:flex items-start pt-1">
          <input 
            type="checkbox" 
            className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" 
            checked={selected}
            onChange={onSelect}
          />
        </div>

        {/* Image */}
        <LocalizedClientLink href={`/products/${handle}`} className="flex-shrink-0">
          <Thumbnail
            thumbnail={item.variant?.product?.thumbnail}
            images={item.variant?.product?.images}
            size="square"
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-lg object-cover"
          />
        </LocalizedClientLink>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Layout */}
          <div className="lg:hidden">
            {/* Black Friday Badge */}
            {((item.variant?.product?.metadata as any)?.black_friday) && (
              <span className="inline-block bg-black text-white text-[10px] px-1.5 py-0.5 rounded mb-1">
                {tProduct("black_friday")}
              </span>
            )}

            {/* Title */}
            {/* Title */}
            <LocalizedClientLink href={`/products/${handle}`} className="block w-full overflow-hidden">
              <Marquee className="font-semibold text-sm sm:text-base mb-1 text-gray-900 hover:text-red-600 transition-colors">
                {getLocalizedLineItemTitle(item, localeStr)}
              </Marquee>
            </LocalizedClientLink>

            {/* Code & Availability */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 mb-2">
              <span>{tProduct("code")}: {item.variant?.sku || "N/A"}</span>
              <span className="text-green-600">• {t("available_today")}</span>
            </div>

            {/* Price & Quantity Row */}
            <div className="flex items-center justify-between gap-2">
              {/* Quantity Controls */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={updating || quantity <= 1}
                  className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold text-sm">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={updating}
                  className="w-7 h-7 sm:w-8 sm:h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                  +
                </button>
              </div>

              {/* Price */}
              <div className="text-right">
                {discount > 0 && (
                  <div className="text-xs text-gray-400 line-through">
                    {convertToLocale({
                      amount: originalPrice * quantity,
                      currency_code: currencyCode || item.cart?.currency_code || "UZS",
                    })}
                  </div>
                )}
                <div className="text-base sm:text-lg font-bold text-red-600">
                  {convertToLocale({
                    amount: finalPrice * quantity,
                    currency_code: currencyCode || item.cart?.currency_code || "UZS",
                  })}
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <DeleteButton id={item.id} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
                {t("remove")}
              </DeleteButton>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="flex justify-between gap-4">
              {/* Left Side */}
              <div className="flex-1 min-w-0">
                {((item.variant?.product?.metadata as any)?.black_friday) && (
                  <span className="inline-block bg-black text-white text-xs px-2 py-1 rounded mb-2">
                    {tProduct("black_friday")}
                  </span>
                )}
                <LocalizedClientLink href={`/products/${handle}`} className="block max-w-full overflow-hidden">
                  <h3 className="font-semibold text-lg mb-1 text-gray-900 hover:text-red-600 transition-colors line-clamp-2" title={getLocalizedLineItemTitle(item, localeStr)}>
                    {getLocalizedLineItemTitle(item, localeStr)}
                  </h3>
                </LocalizedClientLink>
                <p className="text-sm text-gray-600 mb-1">
                  {tProduct("code")}: {(item.variant?.product?.metadata as any)?.code || item.variant?.sku || "N/A"}
                </p>
                <p className="text-sm text-green-600 mb-3">{t("can_be_picked_up_today")}</p>

                <div className="flex items-center gap-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={updating || quantity <= 1}
                      className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={updating}
                      className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <DeleteButton id={item.id} className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1">
                    {t("remove")}
                  </DeleteButton>
                </div>
              </div>

              {/* Right Side - Price */}
              <div className="text-right">
                {discount > 0 && (
                  <div className="text-sm text-gray-500 line-through mb-1">
                    {convertToLocale({
                      amount: originalPrice * quantity,
                      currency_code: currencyCode || item.cart?.currency_code || "UZS",
                    })}
                  </div>
                )}
                <div className="text-xl font-bold text-red-600">
                  {convertToLocale({
                    amount: finalPrice * quantity,
                    currency_code: currencyCode || item.cart?.currency_code || "UZS",
                  })}
                </div>
                {discount > 0 && (
                  <div className="text-sm text-green-600 mt-1">
                    -{Math.round((discount / originalPrice) * 100)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemCard
