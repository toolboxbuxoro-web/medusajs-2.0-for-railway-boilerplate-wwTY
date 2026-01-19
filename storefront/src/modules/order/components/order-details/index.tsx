"use client"

import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { useTranslations } from 'next-intl'

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
  locale?: string
}

import OrderStatusBadge from "@modules/account/components/order-overview/order-status-badge"
import { getOrderDisplayDate, formatOrderDate } from "@lib/util/date"

const OrderDetails = ({ order, showStatus, locale }: OrderDetailsProps) => {
  const t = useTranslations('order')
  const tConfirmed = useTranslations('order_confirmed')
  const isPhoneEmail = order.email?.includes("@phone.local")

  return (
    <div>
      <Text>
        {isPhoneEmail ? (
          <>
            {tConfirmed('confirmation_sent_sms')}{" "}
            <span className="text-ui-fg-medium-plus font-semibold" data-testid="order-phone">
              {order.shipping_address?.phone}
            </span>
          </>
        ) : (
          <>
            {t('order_confirmation_sent_to')}{" "}
            <span
              className="text-ui-fg-medium-plus font-semibold"
              data-testid="order-email"
            >
              {order.email}
            </span>
          </>
        )}
        .
      </Text>
       <Text className="mt-2 text-sm text-gray-600">
        {t('order_date')}:{" "}
        <span data-testid="order-date" className="font-medium text-gray-900">
          {formatOrderDate(getOrderDisplayDate(order), (locale as any) || 'ru')}
        </span>
      </Text>
      <div className="flex items-center gap-x-4 mt-2">
        <Text className="text-ui-fg-interactive">
          {t('order_number')} <span data-testid="order-id">{order.display_id}</span>
        </Text>
        <OrderStatusBadge order={order} />
      </div>
    </div>
  )
}

export default OrderDetails
