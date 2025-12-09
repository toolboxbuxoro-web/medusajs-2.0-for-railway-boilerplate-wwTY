import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import React, { useState } from "react"
import { useTranslations } from "next-intl"
import { placeOrder } from "@lib/data/cart"
import { isPayme } from "@lib/constants"

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const t = useTranslations("checkout")

  // Use isPayme to match provider_id correctly (pp_payme_payme)
  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => isPayme(s.provider_id)
  )

  console.log("[Payme Button] Looking for session with isPayme matcher")
  console.log("[Payme Button] All sessions:", cart.payment_collection?.payment_sessions)
  console.log("[Payme Button] Session found:", session)
  console.log("[Payme Button] Session data:", session?.data)

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    console.log("[Payme Button] handlePayment called")
    console.log("[Payme Button] Session status:", session?.status)

    // If payment is already authorized, place the order
    if (session?.status === "authorized") {
      console.log("[Payme Button] Session is authorized, placing order...")
      try {
        await placeOrder()
      } catch (err: any) {
        setSubmitting(false)
        setErrorMessage(err.message || "Error placing order")
        console.error("[Payme Button] Error placing order:", err)
      }
      return
    }
    
    const paymentUrl = (session?.data as any)?.payment_url
    console.log("[Payme Button] Payment URL:", paymentUrl)
    
    if (paymentUrl) {
      console.log("[Payme Button] Redirecting to Payme...")
      window.location.href = paymentUrl
    } else {
      setSubmitting(false)
      const errMsg = "Payment URL not found. Please refresh the page and try again."
      setErrorMessage(errMsg)
      console.error("[Payme Button] Payme payment URL not found in session.data:", session?.data)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        disabled={notReady || !session}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        {session?.status === "authorized" ? t("place_order") : t("place_order")}
      </Button>
      {errorMessage && (
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
      )}
      {!session && (
        <p className="text-orange-500 text-sm text-center">
          Payment session not initialized. Please go back and select payment method again.
        </p>
      )}
    </div>
  )
}
