import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"
import { getTranslations } from 'next-intl/server'

export default async function CheckoutForm({
  cart,
  customer,
  locale,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  locale: string
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")
  const t = await getTranslations({ locale, namespace: "checkout" })

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div className="w-full">
      <div className="w-full grid grid-cols-1 gap-y-6 lg:gap-y-8">
        {/* Step 1: Delivery & Contact */}
        <div className="checkout-card group hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3 mb-6">
            <div className="step-indicator">1</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('information_and_delivery')}</h2>
          </div>
          <Addresses cart={cart} customer={customer} shippingMethods={shippingMethods} />
        </div>

        {/* Step 2: Payment */}
        <div className="checkout-card group hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3 mb-6">
            <div className="step-indicator">2</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('payment')}</h2>
          </div>
          <Payment cart={cart} availablePaymentMethods={paymentMethods} />
        </div>

        {/* Step 3: Review & Place Order */}
        <div className="checkout-card group hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3 mb-6">
            <div className="step-indicator">3</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('review_and_place_order')}</h2>
          </div>
          <Review cart={cart} />
        </div>
      </div>
    </div>
  )
}
