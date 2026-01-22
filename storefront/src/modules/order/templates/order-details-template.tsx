"use client"

import { useTranslations } from 'next-intl'
import { useParams } from "next/navigation"

import { XMark } from "@medusajs/icons"
import React from "react"

import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

import OrderDetailsSkeleton from "@modules/order/components/order-details-skeleton"
import OrderDetailsErrorState from "@modules/order/components/order-details-error-state"
import { useOrder } from "@lib/hooks/use-order"

type OrderDetailsTemplateProps = {
  // order is now fetched internally by id from params
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = () => {
  const t = useTranslations('order')
  const { id, locale } = useParams()
  const localeStr = String(locale || "ru")
  const orderId = String(id || "")
  
  const { order, state, retry } = useOrder(orderId)
  const [reviewStatuses, setReviewStatuses] = React.useState<Record<string, any>>({})

  React.useEffect(() => {
    import("@lib/data/reviews").then((m) => {
      m.getCustomerReviews().then((res: any) => {
        if (res?.reviews_by_product) {
          setReviewStatuses(res.reviews_by_product)
        }
      })
    })
  }, [])

  // 1. Loading State
  if (state === "loading") {
    return <OrderDetailsSkeleton />
  }

  // 2. Error State
  if (state === "error" || !order) {
    return <OrderDetailsErrorState onRetry={retry} />
  }

  // 3. Success State
  return (
    <div className="flex flex-col justify-center gap-y-4">
      <div className="flex gap-2 justify-between items-center pr-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {t('order_details')} №{order.display_id}
        </h1>
        <LocalizedClientLink
          href="/account/orders"
          className="flex gap-2 items-center text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
          data-testid="back-to-overview-button"
        >
          <XMark className="w-5 h-5" /> 
          <span className="hidden sm:inline">{t('back_to_overview')}</span>
          <span className="sm:hidden">Назад</span>
        </LocalizedClientLink>
      </div>

      <div
        className="flex flex-col gap-6 h-full bg-white w-full border border-gray-100 rounded-2xl p-6 shadow-sm"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus locale={localeStr} />
        <Items items={order.items || []} orderId={order.id} reviewStatuses={reviewStatuses} />
        <ShippingDetails order={order} locale={localeStr} />
        <OrderSummary order={order} locale={localeStr} />
        <div className="pt-6 border-t border-gray-50">
          <Help />
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
