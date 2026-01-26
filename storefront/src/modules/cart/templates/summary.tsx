"use client"

import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { useTranslations } from 'next-intl'

type SummaryProps = {
  cart: HttpTypes.StoreCart
  selectedItemIds: string[]
  handleCheckout: () => void
  isProcessing: boolean
}

const Summary = ({ cart, selectedItemIds, handleCheckout, isProcessing }: SummaryProps) => {
  const t = useTranslations('cart')
  const tCheckout = useTranslations('checkout')

  // Calculate totals based on selection
  const selectedItems = cart?.items?.filter(item => selectedItemIds.includes(item.id)) || []
  const allSelected = cart?.items?.length === selectedItems.length

  const totalItems = selectedItems.reduce((acc, item) => acc + item.quantity, 0)
  // Calculate total weight in grams, then convert to kg and round up
  // Use the same weight access pattern as in checkout
  const totalWeightGrams = selectedItems.reduce((acc, item) => {
    const weightRaw = 
      item.variant?.weight || 
      (item as any).product?.weight || 
      (item.variant as any)?.product?.weight || 
      0
    const weightNum = typeof weightRaw === "string" ? parseFloat(weightRaw) : Number(weightRaw)
    const weight = isNaN(weightNum) ? 0 : weightNum
    return acc + (weight * item.quantity)
  }, 0)
  // Convert grams to kg and round up (500g = 1kg, 4500g = 5kg)
  const totalWeightKg = totalWeightGrams > 0 ? Math.ceil(totalWeightGrams / 1000) : 0

  // Calculate financial totals
  // If all selected, use cart totals (which include shipping, tax, etc correctly)
  // If partial, sum up line items (approximation, excludes shipping/tax unless we sum them too)
  
  let subtotal = 0
  let discount_total = 0
  let total = 0

  if (allSelected) {
    subtotal = cart.subtotal || 0
    discount_total = cart.discount_total || 0
    total = cart.total || 0
  } else {
    // Sum up line items
    // Note: This might miss order-level discounts that aren't distributed to lines, 
    // and definitely misses shipping/tax if they are not on lines.
    // However, for "Selected Items" view, this is the best we can do client-side.
    subtotal = selectedItems.reduce((acc, item) => acc + (item.subtotal || 0), 0)
    discount_total = selectedItems.reduce((acc, item) => acc + (item.discount_total || 0), 0)
    total = selectedItems.reduce((acc, item) => acc + (item.total || 0), 0)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-bold">{tCheckout('order_summary')}</h2>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

        {/* Order Breakdown */}
        <div className="pb-4 border-b border-gray-200 space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-600">
              {t("items_count_weight", { count: totalItems, weight: totalWeightKg })}
            </span>
            <span className="font-semibold">
              {convertToLocale({
                amount: subtotal,
                currency_code: cart.currency_code || "USD",
              })}
            </span>
          </div>
          {discount_total > 0 && (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-green-600">{t("your_benefit")}</span>
              <span className="text-green-600 font-semibold">
                -{convertToLocale({
                  amount: discount_total,
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
              amount: total,
              currency_code: cart.currency_code || "USD",
            })}
          </span>
        </div>

        {/* Checkout Button */}
        <Button 
          onClick={handleCheckout}
          disabled={isProcessing || selectedItemIds.length === 0}
          className="w-full h-11 sm:h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm sm:text-base rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="checkout-button"
        >
          {isProcessing ? tCheckout('processing') : tCheckout('place_order')}
        </Button>

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
