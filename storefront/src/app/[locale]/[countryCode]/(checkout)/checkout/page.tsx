import { Metadata } from "next"
import { notFound } from "next/navigation"
import { redirect } from "next/navigation"
import Wrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { enrichLineItems, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"
import { getTranslations } from 'next-intl/server'
import CheckoutProviderWrapper from "@modules/checkout/components/checkout-provider-wrapper"

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


      {/* Main Content Grid */}
      <div className="content-container py-8">
      <CheckoutProviderWrapper>
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
      </CheckoutProviderWrapper>
      </div>
    </div>
  )
}
