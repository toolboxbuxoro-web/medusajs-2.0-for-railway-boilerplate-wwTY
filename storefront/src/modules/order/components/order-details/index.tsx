import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
  locale?: string
}

import { getTranslations } from 'next-intl/server'

const OrderDetails = async ({ order, showStatus, locale }: OrderDetailsProps) => {
  const t = await getTranslations({ locale: locale || 'ru', namespace: 'order' })
  const isPhoneEmail = order.email?.includes("@phone.local")
  const tConfirmed = await getTranslations({ locale: locale || 'ru', namespace: 'order_confirmed' })

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
      <Text className="mt-2">
        {t('order_date')}
        <span data-testid="order-date">
          {new Date(order.created_at).toDateString()}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        {t('order_number')} <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              {t('order_status')}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {/* TODO: Check where the statuses should come from */}
                {/* {formatStatus(order.fulfillment_status)} */}
              </span>
            </Text>
            <Text>
              {t('payment_status')}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {/* {formatStatus(order.payment_status)} */}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
