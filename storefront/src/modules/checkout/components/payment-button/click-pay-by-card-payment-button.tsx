"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Script from "next/script"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { placeOrder, initiatePaymentSession } from "@lib/data/cart"
import { isClickPayByCard } from "@lib/constants"

type PaymentStatus = "idle" | "checking" | "placing_order" | "error" | "cancelled"

type ClickPublicConfig = {
  merchant_id: string
  service_id: string
  merchant_user_id?: string
  card_type?: "uzcard" | "humo"
}

export const ClickPayByCardPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const t = useTranslations("checkout")
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<PaymentStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [data, setData] = useState<{
    public_config: ClickPublicConfig
    merchant_trans_id: string
    amount: string
  } | null>(null)

  const session = cart.payment_collection?.payment_sessions?.find((s) =>
    isClickPayByCard(s.provider_id)
  )

  const cartTotal = Number(cart.total) || 0
  const isCartEmpty = !cart.items?.length || cartTotal <= 0

  const checkPaymentStatus = useCallback(async (): Promise<string> => {
    try {
      const resp = await fetch(`/api/check-payment?cart_id=${cart.id}`)
      const json = await resp.json()
      return json.status
    } catch {
      return "error"
    }
  }, [cart.id])

  const completeOrder = useCallback(async () => {
    setStatus("placing_order")
    try {
      await placeOrder()
    } catch (err: any) {
      setErrorMessage(err.message || "Ошибка при создании заказа")
      setStatus("error")
    }
  }, [])

  // Refresh payment session once so we have up-to-date amount/public config for checkout.js
  useEffect(() => {
    let isMounted = true

    const run = async () => {
      if (!cart?.id || notReady || isCartEmpty) return
      if (!session?.provider_id) return

      try {
        const resp = await initiatePaymentSession(cart, {
          provider_id: session.provider_id,
        })
        
        if (!isMounted) return
        
        const paymentCollection = resp.payment_collection
        const newSession = paymentCollection?.payment_sessions?.find((s: any) =>
          isClickPayByCard(s.provider_id)
        )
        const d = newSession?.data as any
        if (d?.public_config?.merchant_id && d?.public_config?.service_id) {
          setData({
            public_config: d.public_config,
            merchant_trans_id: d.merchant_trans_id,
            amount: d.amount,
          })
        } else {
          // fallback to existing session data
          const sd = session.data as any
          if (sd?.public_config?.merchant_id && sd?.public_config?.service_id) {
            setData({
              public_config: sd.public_config,
              merchant_trans_id: sd.merchant_trans_id,
              amount: sd.amount,
            })
          }
        }
      } catch (e: any) {
        if (!isMounted) return
        setErrorMessage(e.message || "Ошибка инициализации Click Pay by Card")
        setStatus("error")
      }
    }

    run()
    
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.id])

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
          await new Promise((r) => setTimeout(r, 2000))
        }

        setStatus("error")
        setErrorMessage(
          "Не удалось подтвердить платёж. Пожалуйста, проверьте статус заказа или попробуйте снова."
        )
      }

      checkAndComplete()
    }

    if (
      session?.status === "authorized" ||
      (session?.data as any)?.click_state === "completed"
    ) {
      completeOrder().catch((err) => {
        console.error("[ClickPayByCardButton] Error completing order:", err)
      })
    }
  }, [searchParams, session, checkPaymentStatus, completeOrder, router, cart.region?.countries])

  const widget = useMemo(() => {
    if (!data) return null
    return (
      <form method="post" action="/api/click-callback" data-testid={dataTestId}>
        <Script
          src="https://my.click.uz/pay/checkout.js"
          strategy="afterInteractive"
          className="uzcard_payment_button"
          data-service-id={data.public_config.service_id}
          data-merchant-id={data.public_config.merchant_id}
          data-transaction-param={data.merchant_trans_id}
          data-merchant-user-id={data.public_config.merchant_user_id}
          data-amount={data.amount}
          data-card-type={data.public_config.card_type}
          data-label={t("place_order")}
        />
      </form>
    )
  }, [data, dataTestId, t])

  if (notReady || isCartEmpty) {
    return (
      <div className="text-sm text-orange-500 text-center">
        {isCartEmpty ? "Корзина пуста" : t("select_payment_method")}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-sm text-orange-500 text-center">
        Платёжная сессия не инициализирована. Вернитесь назад и выберите способ оплаты.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {widget || (
        <div className="text-sm text-gray-500 text-center">
          Загружаем кнопку оплаты...
        </div>
      )}

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



