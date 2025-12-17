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
