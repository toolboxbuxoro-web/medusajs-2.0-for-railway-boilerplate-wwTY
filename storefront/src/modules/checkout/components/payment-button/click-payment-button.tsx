"use client"

import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import React, { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { placeOrder } from "@lib/data/cart"
import { isClick } from "@lib/constants"

type PaymentStatus = "idle" | "checking" | "placing_order" | "error" | "cancelled"

export const ClickPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [status, setStatus] = useState<PaymentStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const t = useTranslations("checkout")
  const router = useRouter()
  const searchParams = useSearchParams()

  const session = cart.payment_collection?.payment_sessions?.find((s) =>
    isClick(s.provider_id)
  )

  const cartTotal = Number(cart.total) || 0
  const isCartEmpty = !cart.items?.length || cartTotal <= 0

  const checkPaymentStatus = useCallback(async (): Promise<string> => {
    try {
      const resp = await fetch(`/api/check-payment?cart_id=${cart.id}`)
      const data = await resp.json()
      return data.status
    } catch (error) {
      console.error("[ClickButton] Error checking payment status:", error)
      return "error"
    }
  }, [cart.id])

  const completeOrder = useCallback(async () => {
    setStatus("placing_order")
    try {
      await placeOrder()
    } catch (err: any) {
      console.error("[ClickButton] Error placing order:", err)
      setErrorMessage(err.message || "Ошибка при создании заказа")
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    const paymentStatus = searchParams.get("payment_status")
    const paymentError = searchParams.get("payment_error")

    if (paymentError === "cancelled") {
      setStatus("cancelled")
      setErrorMessage("Платёж отменён. Попробуйте снова.")
      return
    }

    if (paymentStatus === "checking") {
      setStatus("checking")

      const checkAndComplete = async () => {
        let attempts = 0
        const maxAttempts = 10

        while (attempts < maxAttempts) {
          const st = await checkPaymentStatus()

          if (st === "completed") {
            router.push(
              `/${cart.region?.countries?.[0]?.iso_2 || "uz"}/account/orders`
            )
            return
          }

          if (st === "authorized") {
            await completeOrder()
            return
          }

          if (st === "cancelled") {
            setStatus("cancelled")
            setErrorMessage("Платёж был отменён")
            return
          }

          if (st === "error") {
            setStatus("error")
            setErrorMessage("Ошибка проверки статуса платежа")
            return
          }

          attempts++
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }

        setStatus("error")
        setErrorMessage(
          "Не удалось подтвердить платёж. Пожалуйста, проверьте статус заказа или попробуйте снова."
        )
      }

      checkAndComplete()
    }

    if (session?.status === "authorized" || (session?.data as any)?.click_state === "completed") {
      completeOrder()
    }
  }, [searchParams, session, checkPaymentStatus, completeOrder, router, cart.region?.countries])

  const handlePayment = async () => {
    if (isCartEmpty) {
      setErrorMessage("Корзина пуста. Добавьте товары перед оплатой.")
      return
    }

    setStatus("checking")
    setErrorMessage(null)

    if (session?.status === "authorized") {
      await completeOrder()
      return
    }

    try {
      const { initiatePaymentSession } = await import("@lib/data/cart")

      const resp = await initiatePaymentSession(cart, {
        provider_id: session?.provider_id || "pp_click_click",
      })

      const paymentCollection = resp.payment_collection
      const newSession = paymentCollection?.payment_sessions?.find((s: any) =>
        isClick(s.provider_id)
      )
      const newPaymentUrl = (newSession?.data as any)?.payment_url

      if (newPaymentUrl) {
        window.location.href = newPaymentUrl
      } else {
        throw new Error("Не удалось получить ссылку на оплату (Click)")
      }
    } catch (err: any) {
      setStatus("error")
      setErrorMessage(err.message || "Ошибка при инициализации платежа")
    }
  }

  const isLoading = status === "checking" || status === "placing_order"
  const isDisabled = notReady || !session || isCartEmpty || isLoading

  const getButtonText = () => {
    switch (status) {
      case "checking":
        return "Проверка платежа..."
      case "placing_order":
        return "Создание заказа..."
      default:
        return t("place_order")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        disabled={isDisabled}
        isLoading={isLoading}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        {getButtonText()}
      </Button>

      {errorMessage && (
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
      )}

      {status === "cancelled" && (
        <button
          onClick={() => {
            setStatus("idle")
            setErrorMessage(null)
            router.replace(window.location.pathname + "?step=review")
          }}
          className="text-blue-600 text-sm text-center underline"
        >
          Попробовать снова
        </button>
      )}
    </div>
  )
}


