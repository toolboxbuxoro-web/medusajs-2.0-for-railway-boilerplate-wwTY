"use client"

import { Button } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import React, { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { placeOrder } from "@lib/data/cart"
import { isPayme } from "@lib/constants"

type PaymentStatus = 'idle' | 'checking' | 'placing_order' | 'error' | 'cancelled'

export const PaymePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const t = useTranslations("checkout")
  const router = useRouter()
  const searchParams = useSearchParams()

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => isPayme(s.provider_id)
  )

  // Check if cart is empty or has zero total
  const cartTotal = Number(cart.total) || 0
  const isCartEmpty = !cart.items?.length || cartTotal <= 0

  /**
   * Check payment status via API
   */
  const checkPaymentStatus = useCallback(async (): Promise<string> => {
    try {
      const resp = await fetch(`/api/check-payment?cart_id=${cart.id}`)
      const data = await resp.json()
      return data.status
    } catch (error) {
      console.error('[PaymeButton] Error checking payment status:', error)
      return 'error'
    }
  }, [cart.id])

  /**
   * Complete order after successful payment
   */
  const completeOrder = useCallback(async () => {
    setStatus('placing_order')
    try {
      await placeOrder()
      // placeOrder redirects to order confirmation page on success
    } catch (err: any) {
      console.error('[PaymeButton] Error placing order:', err)
      setErrorMessage(err.message || "Ошибка при создании заказа")
      setStatus('error')
    }
  }, [])

  /**
   * Effect: Check payment status when returning from Payme
   */
  useEffect(() => {
    const paymentStatus = searchParams.get('payment_status')
    const paymentError = searchParams.get('payment_error')

    // If payment was cancelled
    if (paymentError === 'cancelled') {
      setStatus('cancelled')
      setErrorMessage('Платёж отменён. Попробуйте снова.')
      return
    }

    // If checking payment status
    if (paymentStatus === 'checking') {
      setStatus('checking')
      
      // Poll payment status
      const checkAndComplete = async () => {
        let attempts = 0
        const maxAttempts = 10
        
        while (attempts < maxAttempts) {
          const status = await checkPaymentStatus()
          
          if (status === 'completed') {
            // Order already created - redirect to orders page
            router.push(`/${cart.region?.countries?.[0]?.iso_2 || 'uz'}/account/orders`)
            return
          }
          
          if (status === 'authorized') {
            // Payment authorized - complete the order
            await completeOrder()
            return
          }
          
          if (status === 'cancelled') {
            setStatus('cancelled')
            setErrorMessage('Платёж был отменён')
            return
          }
          
          if (status === 'error') {
            setStatus('error')
            setErrorMessage('Ошибка проверки статуса платежа')
            return
          }
          
          // Still pending - wait and retry
          attempts++
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
        // Max attempts reached - show manual retry
        setStatus('error')
        setErrorMessage('Не удалось подтвердить платёж. Пожалуйста, проверьте статус заказа или попробуйте снова.')
      }
      
      checkAndComplete()
    }
    
    // Check if session is already authorized (e.g., page refresh)
    if (session?.status === 'authorized' || (session?.data as any)?.payme_state === 2) {
      completeOrder()
    }
  }, [searchParams, session, checkPaymentStatus, completeOrder, router, cart.region?.countries])

  /**
   * Handle payment button click
   */
  const handlePayment = async () => {
    // Prevent payment for empty cart
    if (isCartEmpty) {
      setErrorMessage("Корзина пуста. Добавьте товары перед оплатой.")
      return
    }

    setStatus('checking')
    setErrorMessage(null)

    // If payment is already authorized, place the order
    if (session?.status === "authorized") {
      await completeOrder()
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
        throw new Error("Не удалось получить ссылку на оплату")
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || "Ошибка при инициализации платежа")
    }
  }

  // Button states
  const isLoading = status === 'checking' || status === 'placing_order'
  const isDisabled = notReady || !session || isCartEmpty || isLoading

  // Button text based on status
  const getButtonText = () => {
    switch (status) {
      case 'checking':
        return 'Проверка платежа...'
      case 'placing_order':
        return 'Создание заказа...'
      default:
        return t("place_order")
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Loading overlay when checking payment */}
      {status === 'checking' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">
              Проверяем статус платежа...
            </span>
          </div>
        </div>
      )}

      {status === 'placing_order' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
            <span className="text-green-700 font-medium">
              Платёж подтверждён! Создаём заказ...
            </span>
          </div>
        </div>
      )}

      <Button
        disabled={isDisabled}
        isLoading={isLoading}
        onClick={handlePayment}
        size="large"
        data-testid={dataTestId}
      >
        {getButtonText()}
      </Button>

      {/* Error messages */}
      {errorMessage && (
        <p className="text-red-500 text-sm text-center">{errorMessage}</p>
      )}
      
      {status === 'cancelled' && (
        <button
          onClick={() => {
            setStatus('idle')
            setErrorMessage(null)
            // Remove query params
            router.replace(window.location.pathname + '?step=review')
          }}
          className="text-blue-600 text-sm text-center underline"
        >
          Попробовать снова
        </button>
      )}

      {isCartEmpty && (
        <p className="text-orange-500 text-sm text-center">
          Корзина пуста
        </p>
      )}
      
      {!session && !isCartEmpty && status === 'idle' && (
        <p className="text-orange-500 text-sm text-center">
          Платёжная сессия не инициализирована. Вернитесь назад и выберите способ оплаты.
        </p>
      )}
    </div>
  )
}
