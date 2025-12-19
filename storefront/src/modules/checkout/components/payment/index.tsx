"use client"

import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("checkout")

  const isOpen = searchParams.get("step") === "payment"

  const isStripe = isStripeFunc(activeSession?.provider_id)
  const stripeReady = useContext(StripeContext)

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

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

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async (overrideProviderId?: string) => {
    const providerIdToUse = overrideProviderId || selectedPaymentMethod
    
    if (!providerIdToUse) {
      setError("Please select a payment method")
      return
    }
    
    setIsLoading(true)
    setError(null)
    try {
      const shouldInputCard =
        isStripeFunc(providerIdToUse) && !activeSession

      if (!activeSession) {
        await initiatePaymentSession(cart, {
          provider_id: providerIdToUse,
        })
        router.refresh()
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (!shouldInputCard) {
        router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-xl font-bold text-gray-900 gap-x-2 items-center"
        >
          {t("payment")}
          {!isOpen && paymentReady && (
            <CheckCircleSolid className="text-green-500" />
          )}
        </Heading>
        {!isOpen && paymentReady && (
          <Text className="ml-auto">
            <button
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              data-testid="edit-payment-button"
            >
              {t("edit")}
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {availablePaymentMethods
                  .sort((a, b) => {
                    return a.provider_id > b.provider_id ? 1 : -1
                  })
                  .map((paymentMethod) => {
                    const isSelected = selectedPaymentMethod === paymentMethod.id
                    const info = paymentInfoMap[paymentMethod.id]

                    return (
                        <div
                            key={paymentMethod.id}
                            onClick={async () => {
                                setSelectedPaymentMethod(paymentMethod.id)
                                // If not stripe, auto-advance to next step
                                if (!isStripeFunc(paymentMethod.id)) {
                                    // Small delay to let selection state update visually
                                    setTimeout(() => {
                                        handleSubmit(paymentMethod.id)
                                    }, 300)
                                }
                            }}
                            className={clx(
                                "cursor-pointer rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between h-32 hover:border-blue-500 hover:shadow-md",
                                {
                                    "border-blue-600 ring-1 ring-blue-600 bg-blue-50/10": isSelected,
                                    "border-gray-200 bg-white": !isSelected
                                }
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={clx("font-semibold text-lg", { "text-blue-700": isSelected, "text-gray-900": !isSelected})}>
                                    {info?.title || paymentMethod.id}
                                </span>
                                {isSelected && <CheckCircleSolid className="text-blue-600" />}
                            </div>
                            <div className="self-end opacity-80 scale-125 origin-bottom-right">
                                {info?.icon}
                            </div>
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
                    {paymentInfoMap[selectedPaymentMethod]?.icon || <CreditCard />}
               </div>
               <div className="flex flex-col">
                   <Text className="text-sm text-gray-500 font-medium">
                        {t("payment_method")}
                   </Text>
                   <Text className="font-semibold text-gray-900">
                        {paymentInfoMap[selectedPaymentMethod]?.title || selectedPaymentMethod}
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
