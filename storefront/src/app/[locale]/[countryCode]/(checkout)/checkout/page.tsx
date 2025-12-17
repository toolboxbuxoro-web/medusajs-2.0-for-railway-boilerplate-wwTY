import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: "Checkout",
}

const fetchCart = async () => {
  const cart = await retrieveCart()
  if (!cart) {
    return notFound()
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  // #region agent log
  ;(() => {
    const payload = {
      sessionId: "debug-session",
      runId: "bts-checkout",
      hypothesisId: "H3_server_component_crash_after_bts_selection",
      location: "storefront/src/app/[locale]/[countryCode]/(checkout)/checkout/page.tsx:fetchCart",
      message: "Checkout server fetched cart snapshot (sanitized)",
      data: {
        currency_code: (cart as any)?.currency_code,
        total: (cart as any)?.total,
        shipping_total: (cart as any)?.shipping_total,
        tax_total: (cart as any)?.tax_total,
        subtotal: (cart as any)?.subtotal,
        itemsCount: (cart as any)?.items?.length ?? 0,
        shippingMethods: ((cart as any)?.shipping_methods || []).map((sm: any) => ({
          id: sm?.id,
          shipping_option_id: sm?.shipping_option_id,
          amount: sm?.amount,
          amountType: typeof sm?.amount,
        })),
      },
      timestamp: Date.now(),
    }
    console.log("[agent-debug]", JSON.stringify(payload))
    fetch("http://127.0.0.1:7242/ingest/0a4ffe82-b28a-4833-a3aa-579b3fd64808", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {})
  })()
  // #endregion agent log

  return cart
}

export default async function Checkout({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const cart = await fetchCart()
  const customer = await getCustomer()
  const t = await getTranslations({ locale, namespace: "checkout" })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header with Back Button */}
      <div className="content-container py-6 sm:py-8 animate-fade-in">
        <Link 
          href="/cart" 
          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 font-semibold transition-colors group"
        >
          <svg 
            className="w-5 h-5 transition-transform group-hover:-translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('back_to_cart')}
        </Link>
        
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
          {t('checkout')}
        </h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] content-container gap-6 lg:gap-10 pb-12 animate-scale-in">
        <Wrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} locale={locale} />
        </Wrapper>
        <CheckoutSummary cart={cart} locale={locale} />
      </div>
    </div>
  )
}
