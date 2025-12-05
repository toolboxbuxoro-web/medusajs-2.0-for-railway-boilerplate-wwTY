"use client"

import { Button } from "@medusajs/ui"
import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import MapPin from "@modules/common/icons/map-pin"
import { useTranslations } from 'next-intl'

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const t = useTranslations('cart')
  const tCheckout = useTranslations('checkout')
  const totalItems = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const totalWeight = cart?.items?.reduce((acc, item) => {
    const weight = item.variant?.product?.metadata?.weight 
      ? Number(item.variant.product.metadata.weight) * item.quantity 
      : 0
    return acc + weight
  }, 0) || 0

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-bold">{tCheckout('order_summary')}</h2>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Delivery Method */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">{t("pickup")}</span>
            <button className="text-xs sm:text-sm text-red-600 hover:text-red-700">{t("change")}</button>
          </div>
          <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
            <MapPin size="14" className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{t("pickup_point_placeholder")}</span>
          </div>
        </div>

        {/* Date */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold">{t("date")}</span>
            <button className="text-xs sm:text-sm text-red-600 hover:text-red-700">{t("change")}</button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">{t("pickup_today")}</p>
        </div>

        {/* Buyer */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t("buyer")}</span>
            <button className="text-xs sm:text-sm text-red-600 hover:text-red-700">{t("provide_details")}</button>
          </div>
        </div>

        {/* Payment */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold">{tCheckout("payment")}</span>
            <button className="text-xs sm:text-sm text-red-600 hover:text-red-700">{t("change")}</button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">{t("payment_via_sbp")}</p>
        </div>

        {/* Promo Code */}
        <div className="pb-4 border-b border-gray-200">
          <DiscountCode cart={cart} />
        </div>

        {/* Order Breakdown */}
        <div className="pb-4 border-b border-gray-200 space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">
              {t("items_count_weight", { count: totalItems, weight: totalWeight.toFixed(2) })}
            </span>
            <span className="font-semibold">
              {convertToLocale({
                amount: cart.subtotal || 0,
                currency_code: cart.currency_code || "USD",
              })}
            </span>
          </div>
          {cart.discount_total && cart.discount_total > 0 && (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-green-600">{t("your_benefit")}</span>
              <span className="text-green-600 font-semibold">
                -{convertToLocale({
                  amount: cart.discount_total,
                  currency_code: cart.currency_code || "USD",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-base sm:text-lg font-bold">{t("total")}</span>
          <span className="text-xl sm:text-2xl font-bold text-red-600">
            {convertToLocale({
              amount: cart.total || 0,
              currency_code: cart.currency_code || "USD",
            })}
          </span>
        </div>

        {/* Checkout Button */}
        <LocalizedClientLink
          href={"/checkout?step=" + step}
          data-testid="checkout-button"
          className="block"
        >
          <Button className="w-full h-11 sm:h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm sm:text-base rounded-lg">
            {tCheckout('place_order')}
          </Button>
        </LocalizedClientLink>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>{t("secure_checkout")}</span>
        </div>
      </div>
    </div>
  )
}

export default Summary
