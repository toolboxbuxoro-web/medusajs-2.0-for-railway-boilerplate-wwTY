"use client"

import { RadioGroup } from "@headlessui/react"
import { CheckCircleSolid } from "@medusajs/icons"
import { Button, Heading, Text, clx, Select, Label } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Radio from "@modules/common/components/radio"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { setShippingMethod, updateCart } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import { BTS_REGIONS, calculateBtsCost, getBtsPointsByRegion } from "@lib/data/bts"

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
  
  // BTS State
  const [selectedRegionId, setSelectedRegionId] = useState<string>("")
  const [selectedPointId, setSelectedPointId] = useState<string>("")
  const [estimatedBtsCost, setEstimatedBtsCost] = useState<number | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations("checkout")

  const isOpen = searchParams.get("step") === "delivery"

  const selectedShippingMethod = availableShippingMethods?.find(
    (method) => method.id === cart.shipping_methods?.at(-1)?.shipping_option_id
  )
  
  const isBtsSelected = selectedShippingMethod?.name?.toLowerCase().includes("bts") || false

  // Calculate cart weight (check multiple possible locations)
  const cartWeight = useMemo(() => {
    return cart.items?.reduce((acc, item) => {
      // Weight can be in different places depending on Medusa version:
      // 1. item.variant?.weight - variant level
      // 2. item.product?.weight - product level (Medusa 2.0)
      // 3. item.variant?.product?.weight - nested product
      const weight = 
        item.variant?.weight || 
        (item as any).product?.weight || 
        (item.variant as any)?.product?.weight || 
        0
      return acc + (weight * item.quantity)
    }, 0) || 0
  }, [cart.items])

  useEffect(() => {
    if (isBtsSelected && selectedRegionId) {
      // Medusa weight is typically in grams, convert to kg
      const weightInKg = cartWeight / 1000 
      const cost = calculateBtsCost(weightInKg, selectedRegionId)
      setEstimatedBtsCost(cost)
    } else {
      setEstimatedBtsCost(null)
    }
  }, [isBtsSelected, selectedRegionId, cartWeight])

  // #region agent log
  useEffect(() => {
    if (!isOpen) return
    const payload = {
      sessionId: "debug-session",
      runId: "bts-checkout",
      hypothesisId: "H2_bts_shipping_option_amount_missing",
      location: "storefront/src/modules/checkout/components/shipping/index.tsx:useEffect",
      message: "Shipping options snapshot",
      data: {
        currency_code: cart?.currency_code,
        cartWeight,
        selectedShippingMethod: selectedShippingMethod
          ? {
              id: selectedShippingMethod.id,
              name: selectedShippingMethod.name,
              amount: (selectedShippingMethod as any).amount,
              amountStr: String((selectedShippingMethod as any).amount),
              amountType: typeof (selectedShippingMethod as any).amount,
            }
          : null,
        available: (availableShippingMethods || []).map((m) => ({
          id: m.id,
          name: m.name,
          amount: (m as any).amount,
          amountStr: String((m as any).amount),
          amountType: typeof (m as any).amount,
        })),
      },
      timestamp: Date.now(),
    }
    console.log("[agent-debug]", JSON.stringify(payload))
    fetch("http://127.0.0.1:7242/ingest/0a4ffe82-b28a-4833-a3aa-579b3fd64808", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }, [isOpen, availableShippingMethods, selectedShippingMethod, cartWeight, cart?.currency_code])
  // #endregion agent log

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    try {
        if (isBtsSelected) {
            if (!selectedRegionId || !selectedPointId) {
                setError("Пожалуйста, выберите регион и пункт выдачи")
                setIsLoading(false)
                return
            }
             // Save BTS details to cart metadata
             const region = BTS_REGIONS.find(r => r.id === selectedRegionId)
             const point = region?.points.find(p => p.id === selectedPointId)
             
             await updateCart({ 
                 metadata: {
                     ...cart.metadata,
                     bts_delivery: {
                         region: region?.nameRu,
                         region_id: region?.id,
                         point: point?.name,
                         point_address: point?.address,
                         estimated_cost: estimatedBtsCost,
                         weight_kg: cartWeight / 1000
                     }
                 }
             })
        }
        
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
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          {t("delivery_method")}
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                {t("edit")}
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <div data-testid="delivery-options-container">
          <div className="pb-8">
            <RadioGroup value={selectedShippingMethod?.id} onChange={set}>
              {availableShippingMethods?.map((option) => {
                return (
                  <RadioGroup.Option
                    key={option.id}
                    value={option.id}
                    data-testid="delivery-option-radio"
                    className={clx(
                      "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                      {
                        "border-ui-border-interactive":
                          option.id === selectedShippingMethod?.id,
                      }
                    )}
                  >
                    <div className="flex items-center gap-x-4">
                      <Radio
                        checked={option.id === selectedShippingMethod?.id}
                      />
                      <span className="text-base-regular">{option.name}</span>
                    </div>
                    <span className="justify-self-end text-ui-fg-base">
                      {convertToLocale({
                        amount: option.amount!,
                        currency_code: cart?.currency_code,
                      })}
                    </span>
                  </RadioGroup.Option>
                )
              })}
            </RadioGroup>
          </div>
          
          {isBtsSelected && (
              <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
                  {/* BTS Info Header */}
                  <div className="p-3 md:p-4 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                      <div className="flex items-center gap-2 md:gap-3">
                          <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-ui-bg-base rounded-lg border border-ui-border-base flex items-center justify-center">
                              <svg className="w-4 h-4 md:w-5 md:h-5 text-ui-fg-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 1 0 104 0m-4 0a2 1 0 114 0m6 0a2 1 0 104 0m-4 0a2 1 0 114 0" />
                              </svg>
                          </div>
                          <div>
                              <Text className="text-sm md:text-base font-medium text-ui-fg-base">{t("bts_delivery_info")}</Text>
                              <Text className="text-xs md:text-sm text-ui-fg-subtle">{t("bts_payment_on_delivery")}</Text>
                          </div>
                      </div>
                  </div>

                  {/* Region Selection */}
                  <div className="space-y-1.5 md:space-y-2">
                      <Label className="text-sm md:text-base font-medium text-ui-fg-base">{t("bts_select_region")}</Label>
                      <Select onValueChange={(val) => { setSelectedRegionId(val); setSelectedPointId(""); }} value={selectedRegionId}>
                          <Select.Trigger className="w-full text-sm md:text-base">
                              <Select.Value placeholder={t("bts_region_placeholder")} />
                          </Select.Trigger>
                          <Select.Content>
                              {BTS_REGIONS.map((region) => (
                                  <Select.Item key={region.id} value={region.id}>
                                      {region.nameRu}
                                  </Select.Item>
                              ))}
                          </Select.Content>
                      </Select>
                  </div>
                      
                  {/* Pickup Point Selection */}
                  {selectedRegionId && (
                      <div className="space-y-1.5 md:space-y-2">
                          <Label className="text-sm md:text-base font-medium text-ui-fg-base">{t("bts_select_point")}</Label>
                          <Select onValueChange={setSelectedPointId} value={selectedPointId}>
                              <Select.Trigger className="w-full text-sm md:text-base">
                                  <Select.Value placeholder={t("bts_point_placeholder")} />
                              </Select.Trigger>
                              <Select.Content>
                                  {getBtsPointsByRegion(selectedRegionId).map((point) => (
                                      <Select.Item key={point.id} value={point.id}>
                                          {point.name} — {point.address}
                                      </Select.Item>
                                  ))}
                              </Select.Content>
                          </Select>
                      </div>
                  )}

                  {/* Estimated Cost Display */}
                  {selectedPointId && estimatedBtsCost !== null && (
                      <div className="p-3 md:p-4 bg-ui-bg-subtle-hover rounded-lg border border-ui-border-base">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              <div>
                                  <Text className="text-xs md:text-sm text-ui-fg-subtle">{t("bts_estimated_cost")}</Text>
                                  <Text className="text-lg md:text-xl lg:text-2xl font-semibold text-ui-fg-base">
                                      {convertToLocale({
                                          amount: estimatedBtsCost,
                                          currency_code: cart.currency_code
                                      })}
                                  </Text>
                              </div>
                              <div className="px-2 py-1 md:px-3 bg-ui-bg-base rounded-full border border-ui-border-base self-start sm:self-auto">
                                  <Text className="text-xs md:text-sm text-ui-fg-muted whitespace-nowrap">{t("bts_payment_on_delivery")}</Text>
                              </div>
                          </div>
                          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-ui-border-base">
                              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-ui-fg-muted text-xs md:text-sm">
                                  <span>{t("bts_weight")}: {(cartWeight / 1000).toFixed(1)} kg</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>{t("bts_tariff_info")}</span>
                              </div>
                          </div>
                          <Text className="mt-2 md:mt-3 text-xs md:text-sm text-ui-fg-muted">
                              {t("bts_payment_note")}
                          </Text>
                      </div>
                  )}
              </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!cart.shipping_methods?.[0] || (isBtsSelected && (!selectedRegionId || !selectedPointId))}
            data-testid="submit-delivery-option-button"
          >
            {t("continue_to_payment")}
          </Button>
        </div>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && (cart.shipping_methods?.length ?? 0) > 0 && (
              <div className="flex flex-col w-full sm:w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  {t("method")}
                </Text>
                <Text className="txt-medium text-ui-fg-subtle">
                  {selectedShippingMethod?.name}{" "}
                  {convertToLocale({
                    amount: selectedShippingMethod?.amount!,
                    currency_code: cart?.currency_code,
                  })}
                </Text>
                 {/* Display BTS info if available in metadata */}
                {(cart.metadata?.bts_delivery as any)?.region && (selectedShippingMethod?.name?.toLowerCase().includes("bts")) && (
                    <div className="mt-3 p-3 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
                        <Text className="txt-small text-ui-fg-subtle mb-1">{t("bts_delivery_info")}</Text>
                        <Text className="txt-compact-medium text-ui-fg-base">
                            {(cart.metadata?.bts_delivery as any).region} → {(cart.metadata?.bts_delivery as any).point}
                        </Text>
                        <div className="flex items-center gap-2 mt-2">
                            <Text className="txt-medium-plus text-ui-fg-base">
                                {convertToLocale({
                                    amount: (cart.metadata?.bts_delivery as any).estimated_cost,
                                    currency_code: cart.currency_code
                                })}
                            </Text>
                            <Text className="txt-compact-small text-ui-fg-muted">{t("bts_payment_on_delivery")}</Text>
                        </div>
                        <div className="mt-2 pt-2 border-t border-ui-border-base">
                            <Text className="txt-compact-small text-ui-fg-warning">{t("bts_cod_notice")}</Text>
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
