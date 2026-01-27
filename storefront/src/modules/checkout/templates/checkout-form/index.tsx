import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import ContactAndDelivery from "@modules/checkout/components/contact-and-delivery"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import { getTranslations } from 'next-intl/server'
import { fetchBtsRegions, BTS_PRICING } from "@lib/data/bts"
import CheckoutAccordionWrapper from "@modules/checkout/components/checkout-accordion-wrapper"
import CheckoutErrorBoundary from "@modules/checkout/components/checkout-error-boundary"

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

  const t = await getTranslations({ locale, namespace: "checkout" })

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
      <CheckoutErrorBoundary>
        <CheckoutAccordionWrapper 
          cart={cart}
          customer={customer}
          shippingMethods={shippingMethods}
          paymentMethods={paymentMethods}
          initialBtsData={initialBtsData}
        />
      </CheckoutErrorBoundary>
  )
}


