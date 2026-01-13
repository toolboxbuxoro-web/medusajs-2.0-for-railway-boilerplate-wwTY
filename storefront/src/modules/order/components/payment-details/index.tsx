import { Container, Heading, Text } from "@medusajs/ui"

import { isStripe, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
  locale?: string
}

import { formatOrderDate } from "@lib/util/date"
import { getTranslations } from "next-intl/server"

const PaymentDetails = async ({ order, locale }: PaymentDetailsProps) => {
  const t = await getTranslations({ locale: locale || 'ru', namespace: 'payment' })
  const payment = order.payment_collections?.[0].payments?.[0]

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-xl font-bold my-6">
        {t('header')}
      </Heading>
      <div>
        {payment && (
          <div className="flex flex-col gap-y-4 w-full">
            <div className="flex flex-col">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {t('method')}
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {paymentInfoMap[payment.provider_id].title}
              </Text>
            </div>
            <div className="flex flex-col">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {t('details')}
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {paymentInfoMap[payment.provider_id].icon}
                </Container>
                <Text data-testid="payment-amount">
                  {isStripe(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : t('paid_at', {
                        date: formatOrderDate(payment.created_at ?? "", (locale as any) || 'ru')
                      })}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
