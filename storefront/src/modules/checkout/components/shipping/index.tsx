"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Button, Heading, Text, clx } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { setShippingMethod } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("checkout")

  const isOpen = searchParams.get("step") === "delivery"

  const selectedShippingMethod = availableShippingMethods?.find(
    (method) => method.id === cart.shipping_methods?.at(-1)?.shipping_option_id
  )
  
  const btsMetadata = cart.metadata?.bts_delivery as any
  const isBtsSelected = selectedShippingMethod?.name?.toLowerCase().includes("bts") || !!btsMetadata

  useEffect(() => {
    if (btsMetadata && availableShippingMethods && !selectedShippingMethod) {
      const btsMethod = availableShippingMethods.find(m => m.name.toLowerCase().includes("bts"))
      if (btsMethod) {
        set(btsMethod.id)
      }
    }
  }, [btsMetadata, availableShippingMethods, selectedShippingMethod])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    try {
        router.push(pathname + "?step=payment", { scroll: false })
    } catch (err: any) {
        setError(err.message)
    } finally {
        setIsLoading(false)
    }
  }

  const set = async (id: string) => {
    setIsLoading(true)
    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-xl font-bold text-gray-900 gap-x-2 items-center",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          {t("delivery_method")}
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid className="text-green-500" />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                data-testid="edit-delivery-button"
              >
                {t("edit")}
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <div data-testid="delivery-options-container">
          <div className="pb-8 space-y-4">
             {/* If BTS is selected in previous step, show it as the confirmed operational method */}
             {isBtsSelected && btsMetadata?.region ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                         <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                         </svg>
                    </div>
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                             </svg>
                        </div>
                        <div>
                            <Text className="text-lg font-bold text-gray-900 mb-1">
                                {t("bts_delivery_method_title")}
                            </Text>
                            <Text className="text-gray-600 text-sm mb-3">
                                {t("bts_auto_selected_desc")}
                            </Text>
                            <div className="flex items-center gap-2">
                                <span className="text-blue-700 font-semibold bg-blue-100 px-3 py-1 rounded-md text-sm">
                                    BTS Express
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
             ) : (
                <RadioGroup value={selectedShippingMethod?.id} onChange={set}>
                {availableShippingMethods?.map((option) => {
                    return (
                    <RadioGroup.Option
                        key={option.id}
                        value={option.id}
                        data-testid="delivery-option-radio"
                        className={clx(
                        "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-xl px-6 mb-2 hover:border-blue-500 hover:shadow-md transition-all",
                        {
                            "border-blue-600 ring-1 ring-blue-600 bg-blue-50/10":
                            option.id === selectedShippingMethod?.id,
                            "border-gray-200 bg-white": option.id !== selectedShippingMethod?.id,
                        }
                        )}
                    >
                        <div className="flex items-center gap-x-4">
                        <Radio
                            checked={option.id === selectedShippingMethod?.id}
                        />
                        <span className="text-base font-medium text-gray-900">{option.name}</span>
                        </div>
                        <span className="justify-self-end text-gray-700 font-semibold">
                        {convertToLocale({
                            amount: option.amount!,
                            currency_code: cart?.currency_code,
                        })}
                        </span>
                    </RadioGroup.Option>
                    )
                })}
                </RadioGroup>
             )}
          </div>

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <Button
            size="large"
            className="w-full mt-2 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-transform active:scale-[0.99]"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!cart.shipping_methods?.[0]}
            data-testid="submit-delivery-option-button"
          >
            {t("continue_to_payment")}
          </Button>
        </div>
      ) : (
        <div>
          <div className="text-sm">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-full">
                <Text className="text-base font-medium text-gray-900 mb-1">
                  {selectedShippingMethod?.name}
                </Text>
                
                 {/* Display BTS info if available in metadata */}
                {btsMetadata?.region && isBtsSelected && (
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <Text className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{t("bts_delivery_point")}</Text>
                                <Text className="font-medium text-gray-900">
                                    {btsMetadata.region}
                                </Text>
                            </div>
                        </div>
                        
                        <div className="pl-11">
                             <Text className="text-gray-600 text-sm mb-3">
                                {btsMetadata.point}
                            </Text>

                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-200">
                                 <div className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                      <span className="text-sm font-medium text-gray-900">
                                         {convertToLocale({
                                            amount: btsMetadata.estimated_cost,
                                            currency_code: cart.currency_code
                                         })}
                                      </span>
                                 </div>
                                 <span className="text-sm text-gray-400">|</span>
                                 <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">
                                     {t("bts_payment_on_delivery")}
                                 </span>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Shipping
