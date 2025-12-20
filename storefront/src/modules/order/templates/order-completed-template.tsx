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

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const isOnboarding = cookies().get("_medusa_onboarding")?.value === "true"
  const customer = await getCustomer().catch(() => null)
  const isGuest = !customer

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>Спасибо!</span>
            <span>Ваш заказ успешно оформлен.</span>
          </Heading>

          {/* Guest Account Instructions - only show for NEW quick order customers */}
          {(isGuest || Boolean(order.metadata?.is_new_customer)) && Boolean(order.metadata?.is_quick_order) && order.shipping_address?.phone && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    📱 Данные для входа отправлены на ваш номер
                  </h3>
                  <p className="text-blue-800 mb-3">
                    Мы отправили SMS с логином и паролем на номер <span className="font-semibold">{order.shipping_address.phone}</span>
                  </p>
                  <p className="text-blue-700 text-sm mb-4">
                    Войдите в аккаунт, чтобы:
                  </p>
                  <ul className="text-blue-700 text-sm mb-4 list-disc list-inside space-y-1">
                    <li>Отслеживать статус заказа</li>
                    <li>Видеть историю покупок</li>
                    <li>Получать персональные скидки</li>
                  </ul>
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Войти в аккаунт
                  </Link>
                </div>
              </div>
            </div>
          )}

          <OrderDetails order={order} />
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Итого
          </Heading>
          <Items items={order.items} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}

