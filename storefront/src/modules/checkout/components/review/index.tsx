"use client"

import { useEffect } from "react"
import { Heading, Text, clx } from "@medusajs/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()
  const t = useTranslations("checkout")

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods?.length > 0 &&
    (cart.payment_collection || (cart as any).payment_collection_id || (cart as any).payment_collections?.length > 0 || paidByGiftcard)

  useEffect(() => {
    if (isOpen) {
      console.log("[Review] cart:", {
        id: cart.id,
        shipping_address: !!cart.shipping_address,
        shipping_methods: cart.shipping_methods?.length,
        payment_collection: !!cart.payment_collection,
        paidByGiftcard,
        previousStepsCompleted
      })
    }
  }, [isOpen, cart, paidByGiftcard, previousStepsCompleted])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-2xl sm:text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          {t("review_title")}
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
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
      )}
    </div>
  )
}

export default Review
