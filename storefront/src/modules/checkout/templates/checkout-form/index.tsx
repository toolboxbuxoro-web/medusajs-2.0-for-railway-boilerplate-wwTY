import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import ContactAndDelivery from "@modules/checkout/components/contact-and-delivery"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import { getTranslations } from 'next-intl/server'
import { fetchBtsRegions, BTS_PRICING } from "@lib/data/bts"

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

  const regionId = cart.region_id || cart.region?.id || ""

  const [shippingMethods, paymentMethods, btsRegions] = await Promise.all([
    listCartShippingMethods(cart.id),
    listCartPaymentMethods(regionId),
    fetchBtsRegions().catch((err) => {
      console.error('[CheckoutForm] Failed to fetch BTS regions:', err)
      return []
    }),
  ])
  
  const initialBtsData = {
    regions: btsRegions,
    pricing: BTS_PRICING
  }

  console.log('[CheckoutForm] Fetched BTS regions count:', btsRegions?.length)
  if (btsRegions?.length === 0) {
    console.warn('[CheckoutForm] BTS regions is empty!')
  }
  
  if (process.env.NODE_ENV === "development") {
    console.log(`[CheckoutForm] regionId: ${regionId}, paymentMethods: ${paymentMethods?.length}`)
  }
  const t = await getTranslations({ locale, namespace: "checkout" })

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div className="w-full">
      <div className="w-full grid grid-cols-1 gap-y-6 lg:gap-y-8">
        {/* Step 1: Contact Info + BTS Delivery */}
        <div className="checkout-card group hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-3 mb-6">
            <div className="step-indicator">1</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('information_and_delivery')}</h2>
          </div>
          <ContactAndDelivery 
            cart={cart} 
            customer={customer} 
            availableShippingMethods={shippingMethods}
            initialBtsData={initialBtsData}
          />
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

