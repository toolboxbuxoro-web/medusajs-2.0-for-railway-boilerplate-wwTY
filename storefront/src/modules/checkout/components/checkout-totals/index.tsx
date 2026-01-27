"use client"

import { useCheckout } from "@lib/context/checkout-context"
import { convertToLocale } from "@lib/util/money"
import { useTranslations } from "next-intl"

export default function CheckoutTotals({ 
  cart, 
  locale 
}: { 
  cart: any
  locale: string 
}) {
  const t = useTranslations('checkout')
  const { deliveryCost } = useCheckout()
  
  // Total logic:
  // If we want to show strict total of items (subtotal).
  // The user said: "only total" and "below delivery price".
  // If delivery is 0 in cart (payment on delivery), then cart.total usually equals subtotal (if no tax).
  // Check if cart has shipping methods.
  
  // Assuming 'total' from input meant 'Items Total' for the user based on "remove subtotal, tax etc".
  // Let's use cart.subtotal as the main "Total" if delivery is separate.
  // OR use cart.total if it's correct.
  
  // Let's stick to cart.total but assuming it doesn't include the "payment on delivery" extra cost yet 
  // (unless backend added it, but likely not if it's payment on delivery).
  
  const currencyCode = cart.currency_code
  const totalAmount = cart.total || 0

  return (
    <div className="flex flex-col gap-y-4">
      {/* Total Line */}
      <div className="flex items-center justify-between text-base font-semibold text-gray-900">
        <span>{t('total')}</span>
        <span className="text-xl sm:text-2xl font-bold">
          {convertToLocale({ amount: totalAmount, currency_code: currencyCode, locale })}
        </span>
      </div>

      {/* Delivery Line */}
      {deliveryCost !== null && deliveryCost > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-t border-dashed border-gray-200 gap-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">{t('delivery')}</span>
            <span className="text-[10px] sm:text-xs text-green-600 font-medium">
              ({t('bts_payment_on_delivery')})
            </span>
          </div>
          <span className="text-base font-semibold text-gray-900">
             {convertToLocale({ amount: deliveryCost, currency_code: currencyCode, locale })}
          </span>
        </div>
      )}
    </div>
  )
}
