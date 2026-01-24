import { Metadata } from "next"
import { notFound } from "next/navigation"
import { redirect } from "next/navigation"
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

const fetchCart = async (locale: string, countryCode: string) => {
  const cart = await retrieveCart()
  if (!cart) {
    redirect(`/${locale}/${countryCode}/cart?checkout_error=no_cart`)
  }

  if (cart?.items?.length) {
    const enrichedItems = await enrichLineItems(cart?.items, cart?.region_id!)
    cart.items = enrichedItems as HttpTypes.StoreCartLineItem[]
  }

  return cart
}

export default async function Checkout(props: {
  params: Promise<{ locale: string; countryCode: string }>
}) {
  const params = await props.params
  const { locale, countryCode } = params
  const cart = await fetchCart(locale, countryCode)
  const customer = await getCustomer()
  const t = await getTranslations({ locale, namespace: "checkout" })

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Uzum-style Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="content-container py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link 
                href={`/${locale}/${countryCode}/cart`} 
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group text-sm font-medium"
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
                <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {t('checkout')}
                </h1>
            </div>
            {/* Secure Checkout Badge */}
            <div className="hidden sm:flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wide">Secure Checkout</span>
            </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 lg:gap-8 items-start">
          <div className="animate-fade-in-up">
            <Wrapper cart={cart}>
              <CheckoutForm cart={cart} customer={customer} locale={locale} />
            </Wrapper>
          </div>
          <div className="lg:sticky lg:top-8 animate-fade-in-up animation-delay-150">
            <CheckoutSummary cart={cart} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  )
}
