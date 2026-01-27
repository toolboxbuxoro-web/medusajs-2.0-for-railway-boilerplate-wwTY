"use client"

import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { RadioGroup } from "@headlessui/react"
import ErrorMessage from "@modules/checkout/components/error-message"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, Tooltip, clx } from "@medusajs/ui"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"

import Divider from "@modules/common/components/divider"
import PaymentContainer from "@modules/checkout/components/payment-container"
import { isStripe as isStripeFunc, paymentInfoMap } from "@lib/constants"
import { StripeContext } from "@modules/checkout/components/payment-wrapper"
import { initiatePaymentSession } from "@lib/data/cart"
import { useTranslations } from "next-intl"

import { HttpTypes } from "@medusajs/types"
import { PaymentSummary } from "@lib/context/checkout-context"

const Payment = ({
  cart,
  availablePaymentMethods,
  onComplete,
}: {
  cart: any
  availablePaymentMethods: any[]
  onComplete?: (data: PaymentSummary) => void
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending" || paymentSession.status === "authorized"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const router = useRouter()
  const t = useTranslations("checkout")

  const isOpen = true // Controlled by accordion

  const isStripe = isStripeFunc(activeSession?.provider_id)

  const stripeReady = useContext(StripeContext)

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const hasShippingMethod = (cart?.shipping_methods?.length ?? 0) > 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const useOptions: StripeCardElementOptions = useMemo(() => {
    return {
      style: {
        base: {
          fontFamily: "Inter, sans-serif",
          color: "#424270",
          "::placeholder": {
            color: "rgb(107 114 128)",
          },
        },
      },
      classes: {
        base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover transition-all duration-300 ease-in-out",
      },
    }
  }, [])

  const handleSubmit = async (overrideProviderId?: string) => {
    const providerIdToUse = overrideProviderId || selectedPaymentMethod
    
    if (!providerIdToUse) {
      setError("Please select a payment method")
      return
    }

    // Most providers (incl. Payme) require shipping methods to calculate totals.
    if (!paidByGiftcard && !hasShippingMethod) {
      setError("Сначала выберите способ доставки")
      return
    }
    
    setIsLoading(true)
    setError(null)
    try {
      const shouldInputCard =
        isStripeFunc(providerIdToUse) &&
        (!activeSession || activeSession.provider_id !== providerIdToUse)

      const shouldInitiate =
        !activeSession || activeSession.provider_id !== providerIdToUse

      if (shouldInitiate) {
        await initiatePaymentSession(cart, {
          provider_id: providerIdToUse,
        })
        router.refresh()
      }

      if (!shouldInputCard) {
        const displayNames: Record<string, string> = {
          'pp_click_click': 'Click',
          'pp_payme_payme': 'Payme',
          'pp_stripe_stripe': 'Банковская карта',
          'manual': 'Оплата вручную',
          'stripe': 'Банковская карта'
        }
        
        onComplete?.({
          method: displayNames[providerIdToUse.toLowerCase()] || providerIdToUse
        })
        router.refresh()
      }
    } catch (err: any) {
      console.error("[Payment handleSubmit] Error:", err)
      setError(err?.message || "An error occurred while processing payment")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Keep local selection in sync with the actual active payment session after refresh.
  useEffect(() => {
    if (activeSession?.provider_id) {
      setSelectedPaymentMethod(activeSession.provider_id)
    }
  }, [activeSession?.provider_id])

  return (
    <div className="bg-white">
      <div>
        <div className="block">
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {availablePaymentMethods
                  .sort((a, b) => {
                    return (a.id || "") > (b.id || "") ? 1 : -1
                  })
                  .map((paymentMethod) => {
                    const isSelected = selectedPaymentMethod === paymentMethod.id
                    const info = paymentInfoMap[paymentMethod.id]

                    return (
                        <div
                            key={paymentMethod.id}
                            onClick={async () => {
                              setSelectedPaymentMethod(paymentMethod.id)

                              if (!isStripeFunc(paymentMethod.id)) {
                                await handleSubmit(paymentMethod.id)
                              }
                            }}
                            className={clx(
                                "group cursor-pointer rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between h-36 relative overflow-hidden",
                                {
                                    "border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/20 backdrop-blur-sm shadow-inner": isSelected,
                                    "border-gray-200 bg-white hover:border-blue-400 hover:shadow-lg hover:-translate-y-1": !isSelected
                                }
                            )}
                        >
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex flex-col">
                                  <span className={clx("font-bold text-base sm:text-lg transition-colors", { 
                                    "text-blue-700": isSelected, 
                                    "text-gray-900": !isSelected
                                  })}>
                                      {info?.title || paymentMethod.id}
                                  </span>
                                  {isSelected && (
                                    <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider mt-0.5">
                                      {t("payment_method_selected") || "Выбран"}
                                    </span>
                                  )}
                                </div>
                                <div className={clx("w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300", {
                                  "bg-blue-600 scale-110 shadow-md": isSelected,
                                  "bg-gray-100": !isSelected
                                })}>
                                  {isSelected ? (
                                    <CheckCircleSolid className="text-white w-4 h-4" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                                  )}
                                </div>
                            </div>
                            <div className={clx("self-end transition-transform duration-500", {
                              "scale-150 -translate-y-1": isSelected,
                              "scale-125 group-hover:scale-135": !isSelected
                            })}>
                                {info?.icon}
                            </div>

                            {/* Decorative background element for premium feel */}
                            {isSelected && (
                              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                            )}
                        </div>
                    )
                  })}
            </div>
          )}

          {isStripe && stripeReady && (
            <div className="mt-5 transition-all duration-150 ease-in-out">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {t("enter_card_details")}:
                </Text>

                <CardElement
                options={useOptions as StripeCardElementOptions}
                onChange={(e) => {
                    setCardBrand(
                    e.brand &&
                        e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                    )
                    setError(e.error?.message || null)
                    setCardComplete(e.complete)
                }}
                />
            </div>
            )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="w-full mt-6 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-transform active:scale-[0.99]"
            onClick={() => handleSubmit()}
            isLoading={isLoading}
            disabled={
              (isStripe && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeFunc(selectedPaymentMethod)
              ? ` ${t("enter_card_details")}`
              : t("continue_to_review")}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-center gap-3">
               <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                    {paymentInfoMap[activeSession?.provider_id]?.icon || paymentInfoMap[selectedPaymentMethod]?.icon || <CreditCard />}
               </div>
               <div className="flex flex-col">
                   <Text className="text-sm text-gray-500 font-medium">
                        {t("payment_method")}
                   </Text>
                   <Text className="font-semibold text-gray-900">
                        {paymentInfoMap[activeSession?.provider_id]?.title || activeSession?.provider_id}
                   </Text>
               </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-full sm:w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                {t("payment_method")}
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                {t("gift_card")}
              </Text>
            </div>
          ) : null}
        </div>
      </div>

    </div>
  )
}

export default Payment
