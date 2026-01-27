"use client"

import { Text } from "@medusajs/ui"
import PaymentButton from "../payment-button"
import { useTranslations } from "next-intl"

const Review = ({ cart }: { cart: any }) => {
  const t = useTranslations("checkout")

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    !!cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (!!cart.payment_collection || !!(cart as any).payment_collection_id || !!(cart as any).payment_collections?.length || paidByGiftcard)

  return (
    <div className="bg-white">
      {previousStepsCompleted ? (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1 break-words">
                {t("legal_text")}
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      ) : (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <Text className="text-gray-500 italic">
            {t("please_complete_previous_steps") || "Пожалуйста, заполните предыдущие шаги"}
          </Text>
        </div>
      )}
    </div>
  )
}

export default Review
