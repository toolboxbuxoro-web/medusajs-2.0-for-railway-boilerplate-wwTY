import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
  locale?: string
}

import { getTranslations } from 'next-intl/server'

const ShippingDetails = async ({ order, locale }: ShippingDetailsProps) => {
  const t = await getTranslations({ locale: locale || 'ru', namespace: 'order' })
  
  /**
   * BTS-ONLY DELIVERY DESIGN
   * 
   * This project strictly uses BTS Pickup points. 
   * Traditional street addresses (address_1, city, etc.) are intentionally 
   * excluded from the UI to reflect the business model.
   * 
   * Delivery data is extracted from order.metadata.bts_delivery.
   */
  const btsDelivery = (order.metadata?.bts_delivery as any) || {}

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-xl font-bold my-6">
        {t('delivery')}
      </Heading>
      <div className="flex flex-col gap-y-6">
        <div
          className="flex flex-col"
          data-testid="shipping-address-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1 font-semibold">
            {t('delivery_method')}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle mb-4">
            BTS Pickup
          </Text>

          <Text className="txt-medium-plus text-ui-fg-base mb-1 font-semibold">
            {t('bts_delivery_point')}
          </Text>
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-2">
            <Text className="text-sm font-bold text-gray-900 mb-1">
              {btsDelivery.region || t('region_not_specified')}
            </Text>
            <Text className="text-xs text-gray-600 font-medium">
              {btsDelivery.point || t('point_not_specified')}
            </Text>
            {btsDelivery.point_address && (
              <Text className="text-xs text-gray-400 mt-1 italic">
                {btsDelivery.point_address}
              </Text>
            )}
          </div>
        </div>

        <div
          className="flex flex-col"
          data-testid="shipping-contact-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1 font-semibold">{t('recipient')}</Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.first_name} {order.shipping_address?.last_name}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.phone}
          </Text>
          {!order.email?.includes("@phone.local") && (
            <Text className="txt-medium text-ui-fg-subtle">{order.email}</Text>
          )}
        </div>

        <div
          className="flex flex-col"
          data-testid="shipping-method-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1 font-semibold">{t('method')}</Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {(order as any).shipping_methods?.[0]?.name}
            {order.shipping_methods?.[0]?.total !== undefined && (
              <>
                {" "}
                ({convertToLocale({
                  amount: order.shipping_methods?.[0]?.total ?? 0,
                  currency_code: order.currency_code,
                })
                  .replace(/,/g, "")
                  .replace(/\./g, ",")}
                )
              </>
            )}
          </Text>
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default ShippingDetails
