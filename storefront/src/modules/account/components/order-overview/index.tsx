"use client"

import { Button } from "@medusajs/ui"
import { useTranslations } from 'next-intl'

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const t = useTranslations('account')
  
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-8 w-full">
        {orders.map((o) => (
          <div
            key={o.id}
            className="border-b border-gray-200 pb-6 last:pb-0 last:border-none"
          >
            <OrderCard order={o} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi">{t('no_orders_title')}</h2>
      <p className="text-base-regular">
        {t('no_orders_message')}
      </p>
      <div className="mt-4">
        <LocalizedClientLink 
          href="/store" 
          className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          data-testid="continue-shopping-button"
        >
          {t('continue_shopping')}
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
