import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import React, { useState } from "react"
import { useTranslations } from "next-intl"

export const PaymePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const t = useTranslations("checkout")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.provider_id === "payme"
  )

  const handlePayment = async () => {
    setSubmitting(true)

    // If payment is already authorized, place the order
    if (session?.status === "authorized") {
      try {
        await placeOrder()
      } catch (err) {
        setSubmitting(false)
        console.error("Error placing order:", err)
      }
      return
    }
    
    const paymentUrl = (session?.data as any)?.payment_url
    
    if (paymentUrl) {
      window.location.href = paymentUrl
    } else {
      setSubmitting(false)
      console.error("Payme payment URL not found")
    }
  }

  return (
    <Button
      disabled={notReady}
      isLoading={submitting}
      onClick={handlePayment}
      size="large"
      data-testid={dataTestId}
    >
      {session?.status === "authorized" ? t("place_order") : t("place_order")}
    </Button>
  )
}
