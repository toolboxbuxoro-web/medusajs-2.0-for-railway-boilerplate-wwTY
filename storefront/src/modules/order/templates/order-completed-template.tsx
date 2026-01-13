import { Heading } from "@medusajs/ui"
import { cookies } from "next/headers"
import Link from "next/link"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"
import { getTranslations } from "next-intl/server"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
  locale?: string
}

export default async function OrderCompletedTemplate({
  order,
  locale
}: OrderCompletedTemplateProps) {
  const isOnboarding = cookies().get("_medusa_onboarding")?.value === "true"
  const customer = await getCustomer().catch(() => null)
  const isGuest = !customer

  const t = await getTranslations({ locale: locale || 'ru', namespace: 'order' })
  const tConfirmed = await getTranslations({ locale: locale || 'ru', namespace: 'order_confirmed' })
  const isPhoneEmail = order.email?.includes("@phone.local")
  const isNewAccount = Boolean(order.metadata?.is_new_customer) || Boolean(order.metadata?.tmp_generated_password)

  return (
    <div className="py-10 min-h-[calc(100vh-64px)] bg-gray-50/50">
      <div className="content-container flex flex-col gap-y-8 max-w-4xl mx-auto w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        
        <div
          className="flex flex-col gap-y-8 h-full w-full"
          data-testid="order-complete-container"
        >
          {/* 1. Success message */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <Heading
              level="h1"
              className="flex flex-col gap-y-2 text-ui-fg-base text-4xl font-bold"
            >
              <span className="text-green-600">{tConfirmed('title')}</span>
              <span className="text-gray-600 text-xl font-normal">{tConfirmed('subtitle')}</span>
            </Heading>
          </div>

          {/* 2. Account Created Block (if applicable) */}
          {isNewAccount && (
            <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-200">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="bg-white/20 p-4 rounded-2xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-3">
                    {tConfirmed('account_created_title')}
                  </h3>
                  <p className="text-blue-50 text-lg opacity-90 mb-6 leading-relaxed">
                    {tConfirmed('account_created_text')}
                  </p>
                  <div className="flex flex-col items-center md:items-start gap-4">
                    <Link
                      href="/account"
                      className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl transition-all hover:bg-blue-50 hover:scale-105 inline-block"
                    >
                      {tConfirmed('login_button')}
                    </Link>
                    <p className="text-blue-100 text-sm italic">
                      {tConfirmed('login_helper')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. What's Next Block */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
              {tConfirmed('whats_next_title')}
            </h3>
            <div className="grid gap-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {num}
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {tConfirmed(`whats_next_step${num}` as any)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Order Details */}
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="mb-8 pb-8 border-b border-gray-100">
              <OrderDetails order={order} locale={locale} />
            </div>
            
            <Heading level="h2" className="text-2xl font-bold mb-6 text-gray-900">
              {t('total')}
            </Heading>
            <Items items={order.items} />
            <div className="mt-8 pt-8 border-t border-gray-100">
              <CartTotals totals={order} locale={locale} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8">
              <ShippingDetails order={order} locale={locale} />
              <PaymentDetails order={order} locale={locale} />
            </div>
          </div>
          
          <div className="text-center py-4">
            <Help />
          </div>
        </div>
      </div>
    </div>
  )
}
