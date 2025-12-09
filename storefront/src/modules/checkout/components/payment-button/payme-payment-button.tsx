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
  console.log("==========================================")
  console.log("💳 CART ID FOR PAYME (order_id):", cart.id)
  console.log("💰 CART TOTAL (amount):", cart.total)
  console.log("==========================================")

  const handlePayment = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    // If payment is already authorized, place the order
    if (session?.status === "authorized") {
      try {
        await placeOrder()
      } catch (err: any) {
        setSubmitting(false)
        setErrorMessage(err.message || "Error placing order")
      }
      return
    }
    
    try {
      // Always generate fresh payment URL with current cart.total
      // This prevents amount mismatch when cart was modified after session creation
      console.log("[Payme] Generating fresh payment URL with cart.total:", cart.total)
      
      const { initiatePaymentSession } = await import("@lib/data/cart")
      
      const resp = await initiatePaymentSession(cart, {
        provider_id: session?.provider_id || "pp_payme_payme"
      })
      
      const paymentCollection = resp.payment_collection
      const newSession = paymentCollection?.payment_sessions?.find((s: any) => isPayme(s.provider_id))
      const newPaymentUrl = (newSession?.data as any)?.payment_url
      
      console.log("[Payme] Fresh URL generated:", newPaymentUrl)
      
      if (newPaymentUrl) {
        window.location.href = newPaymentUrl
      } else {
        throw new Error("Failed to generate payment URL")
      }
    } catch (err: any) {
      setSubmitting(false)
      setErrorMessage(err.message || "Error initiating payment")
      console.error("[Payme] Error:", err)
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
