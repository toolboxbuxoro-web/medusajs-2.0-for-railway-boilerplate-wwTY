import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
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
  const [checkingStatus, setCheckingStatus] = useState(false)
  const t = useTranslations("checkout")
  const router = useRouter()

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => isPayme(s.provider_id)
  )

  // Check if cart is empty or has zero total
  const cartTotal = Number(cart.total) || 0
  const isCartEmpty = !cart.items?.length || cartTotal <= 0

  // Проверка статуса после возврата с Payme
  useEffect(() => {
    if (!session || checkingStatus) return

    // Если платеж авторизован - создаем заказ
    if (session.status === "authorized") {
      setCheckingStatus(true)
      placeOrder().catch((err: any) => {
        setCheckingStatus(false)
        setErrorMessage(err.message || "Error placing order")
      })
      return
    }

    // Если payme_state=2 но статус не обновлен - обновляем страницу
    const sessionData = session.data as any
    if (sessionData?.payme_state === 2 && session.status !== "authorized") {
      setCheckingStatus(true)
      setTimeout(() => router.refresh(), 500)
    }
  }, [session, router, checkingStatus])

  const handlePayment = async () => {
    // Prevent payment for empty cart
    if (isCartEmpty) {
      setErrorMessage("Cart is empty. Please add items before paying.")
      return
    }

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
      const { initiatePaymentSession } = await import("@lib/data/cart")
      
      const resp = await initiatePaymentSession(cart, {
        provider_id: session?.provider_id || "pp_payme_payme"
      })
      
      const paymentCollection = resp.payment_collection
      const newSession = paymentCollection?.payment_sessions?.find((s: any) => isPayme(s.provider_id))
      const newPaymentUrl = (newSession?.data as any)?.payment_url
      
      if (newPaymentUrl) {
        window.location.href = newPaymentUrl
      } else {
        throw new Error("Failed to generate payment URL")
      }
    } catch (err: any) {
      setSubmitting(false)
      setErrorMessage(err.message || "Error initiating payment")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        disabled={notReady || !session || isCartEmpty || checkingStatus}
        isLoading={submitting || checkingStatus}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        {checkingStatus 
          ? t("checking_payment_status") || "Checking payment status..."
          : session?.status === "authorized" 
            ? t("place_order") 
            : t("place_order")}
      </Button>
      {errorMessage && (
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
      )}
      {isCartEmpty && (
        <p className="text-orange-500 text-sm text-center">
          {t("cart_empty") || "Your cart is empty"}
        </p>
      )}
      {!session && !isCartEmpty && (
        <p className="text-orange-500 text-sm text-center">
          Payment session not initialized. Please go back and select payment method again.
        </p>
      )}
    </div>
  )
}

