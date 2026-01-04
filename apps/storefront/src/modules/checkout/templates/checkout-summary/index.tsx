import { Heading } from "@medusajs/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { getTranslations } from 'next-intl/server'

import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = async ({
  cart,
  locale,
}: {
  cart: any
  locale: string
}) => {
  const t = await getTranslations({ locale, namespace: "checkout" })
  
  return (
    <div className="lg:sticky lg:top-4 h-fit">
      <div className="summary-card">
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="checkout-icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <Heading
            level="h2"
            className="text-2xl sm:text-3xl font-bold text-gray-800"
          >
            {t('order_summary')}
          </Heading>
        </div>

        <Divider className="my-6 border-gray-200" />
        
        {/* Cart Totals */}
        <div className="mb-6">
          <CartTotals totals={cart} />
        </div>

        <Divider className="my-6 border-gray-200" />

        {/* Items Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('items_in_cart')}</h3>
          <ItemsPreviewTemplate items={cart?.items} />
        </div>

        {/* Discount Code */}
        <div className="pt-4 border-t-2 border-gray-200">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummary
