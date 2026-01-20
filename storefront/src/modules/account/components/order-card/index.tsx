"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useParams } from "next/navigation"
import { getLocalizedLineItemTitle } from "@lib/util/get-localized-line-item"
import { getTrackingNumbers } from "@lib/util/order-tracking"
import OrderStatusBadge from "../order-overview/order-status-badge"
import { getOrderDisplayDate, formatOrderDateShort } from "@lib/util/date"
import ChevronDown from "@modules/common/icons/chevron-down"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const t = useTranslations("account")
  const tOrder = useTranslations("order")
  const { locale } = useParams()
  const localeStr = String(locale || "ru")
  
  const trackingNumbers = getTrackingNumbers(order)

  const getItemsSummary = () => {
    if (!order.items || order.items.length === 0) return ""
    
    // Use localized title
    const mainItem = getLocalizedLineItemTitle(order.items[0], localeStr)
    const extraCount = order.items.length - 1
    
    if (extraCount <= 0) return mainItem

    if (localeStr === "uz") {
      return `${mainItem} + ${extraCount} ta mahsulot`
    }
    
    // Russian pluralization (simplistic for 1, 2, 5 rule, but matching mobile's 1 vs others)
    const suffix = extraCount === 1 ? "товар" : "товара"
    return `${mainItem} + ${extraCount} ${suffix}`
  }

  return (
    <LocalizedClientLink
      href={`/account/orders/details/${order.id}`}
      className="group block no-underline"
    >
      <div 
        className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all duration-300 shadow-sm" 
        data-testid="order-card"
      >
        <div className="flex flex-col">
          {/* Header: ID and Status */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-base font-bold text-gray-900">
              {t('order_number') || "Заказ"} №{order.display_id}
            </span>
            <OrderStatusBadge order={order} />
          </div>

          {/* Date */}
          <span className="text-[13px] text-gray-500 mb-1">
            {formatOrderDateShort(getOrderDisplayDate(order), localeStr as any)}
          </span>

          {/* Tracking (first tracking number, if available) */}
          {trackingNumbers.length > 0 && (
            <span className="text-[13px] text-gray-600 mb-2">
              {tOrder("tracking_number")}:{" "}
              <span className="font-mono tracking-wide">
                {trackingNumbers[0]}
              </span>
            </span>
          )}

          {/* Items Summary */}
          <span className="text-sm text-gray-700 mb-4 line-clamp-1">
            {getItemsSummary()}
          </span>

          {/* Footer: Amount */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <span className="text-[13px] text-gray-500">
              {t('total_amount') || "Сумма заказа"}
            </span>
            <span className="text-base font-bold text-gray-900" data-testid="order-amount">
              {convertToLocale({
                amount: order.total,
                currency_code: order.currency_code,
                locale: localeStr
              })}
            </span>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}

export default OrderCard
