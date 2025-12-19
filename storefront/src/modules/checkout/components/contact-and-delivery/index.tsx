"use client"

import { HttpTypes } from "@medusajs/types"
import { Container, Select, Label, Text, Heading } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import PhoneInput from "@modules/common/components/phone-input"
import React, { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

// Types for BTS data
interface BtsPoint {
  id: string
  name: string
  address: string
}

interface BtsRegion {
  id: string
  name: string
  nameRu: string
  zone: 1 | 2 | 3
  points: BtsPoint[]
}

interface BtsPricing {
  zoneRates: Record<1 | 2 | 3, number>
  expressRates: Record<number, Record<1 | 2 | 3, number>>
  expressMaxWeight: number
  minWeight: number
  winterMonths: number[]
  winterFuelSurcharge: number
}

interface BtsData {
  regions: BtsRegion[]
  pricing: BtsPricing
}

// Calculate BTS cost on client side using pricing from backend
const calculateBtsCost = (
  weightKg: number,
  regionId: string,
  regions: BtsRegion[],
  pricing: BtsPricing
): number => {
  const region = regions.find((r) => r.id === regionId)
  if (!region || !pricing) return 0

  const roundedWeight = Math.ceil(Math.max(pricing.minWeight, weightKg))

  let cost: number

  if (roundedWeight <= pricing.expressMaxWeight) {
    const tiers = Object.keys(pricing.expressRates)
      .map(Number)
      .sort((a, b) => a - b)
    const tier = tiers.find((t) => t >= roundedWeight) || tiers[tiers.length - 1]
    cost = pricing.expressRates[tier][region.zone]
  } else {
    const ratePerKg = pricing.zoneRates[region.zone]
    cost = roundedWeight * ratePerKg
  }

  // Winter fuel surcharge
  const currentMonth = new Date().getMonth() + 1
  if (pricing.winterMonths.includes(currentMonth)) {
    cost *= 1 + pricing.winterFuelSurcharge
  }

  return Math.round(cost)
}

interface ContactAndDeliveryProps {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  availableShippingMethods?: HttpTypes.StoreCartShippingOption[]
}

const ContactAndDelivery: React.FC<ContactAndDeliveryProps> = ({
  cart,
  customer,
  availableShippingMethods,
}) => {
  const t = useTranslations("checkout")
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  // Form state
  const [phone, setPhone] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  // BTS state
  const [btsData, setBtsData] = useState<BtsData | null>(null)
  const [selectedRegionId, setSelectedRegionId] = useState("")
  const [selectedPointId, setSelectedPointId] = useState("")
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get BTS shipping method ID
  const btsMethodId = useMemo(() => {
    const btsMethod = availableShippingMethods?.find((m) =>
      (m.name || "").toLowerCase().includes("bts")
    )
    return btsMethod?.id || availableShippingMethods?.[0]?.id || ""
  }, [availableShippingMethods])

  // Fetch BTS data from backend
  useEffect(() => {
    const fetchBtsData = async () => {
      try {
        const backendUrl = (
          process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
        ).replace(/\/$/, "")
        const publishableKey =
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

        const response = await fetch(`${backendUrl}/store/bts`, {
          headers: {
            "x-publishable-api-key": publishableKey,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setBtsData(data)
        }
      } catch (err) {
        console.error("Failed to fetch BTS data:", err)
        // Fallback: use local import if backend fetch fails
        import("@lib/data/bts").then((mod) => {
          setBtsData({
            regions: mod.BTS_REGIONS as unknown as BtsRegion[],
            pricing: {
              zoneRates: { 1: 5000, 2: 6000, 3: 6500 },
              expressRates: {
                1: { 1: 25000, 2: 30000, 3: 35000 },
                5: { 1: 45000, 2: 55000, 3: 60000 },
                10: { 1: 65000, 2: 80000, 3: 90000 },
                20: { 1: 100000, 2: 120000, 3: 135000 },
              },
              expressMaxWeight: 20,
              minWeight: 1,
              winterMonths: [12, 1, 2, 3],
              winterFuelSurcharge: 0.3,
            },
          })
        })
      }
    }

    fetchBtsData()
  }, [])

  // Initialize form with cart data
  useEffect(() => {
    if (cart) {
      if (cart.shipping_address) {
        setPhone(cart.shipping_address.phone || "")
        setFirstName(cart.shipping_address.first_name || "")
        setLastName(cart.shipping_address.last_name || "")
      }

      const btsDelivery = (cart.metadata?.bts_delivery as any) 
      if (btsDelivery?.region_id) {
        setSelectedRegionId(btsDelivery.region_id)
        if (btsDelivery.point_id) {
          setSelectedPointId(btsDelivery.point_id)
        }
      }
    }
  }, [cart])

  // Calculate cart weight
  const cartWeight = useMemo(() => {
    return (
      cart?.items?.reduce((acc, item) => {
        const weightRaw =
          item.variant?.weight ||
          (item as any).product?.weight ||
          (item.variant as any)?.product?.weight ||
          0
        const weightNum =
          typeof weightRaw === "string" ? parseFloat(weightRaw) : Number(weightRaw)
        const weight = isNaN(weightNum) ? 0 : weightNum
        return acc + weight * item.quantity
      }, 0) || 0
    )
  }, [cart?.items])

  // Calculate estimated cost when region changes
  useEffect(() => {
    if (selectedRegionId && btsData) {
      const effectiveWeight = cartWeight > 0 ? cartWeight : 1000
      const weightInKg = effectiveWeight / 1000
      const cost = calculateBtsCost(
        weightInKg,
        selectedRegionId,
        btsData.regions,
        btsData.pricing
      )
      setEstimatedCost(cost)
    } else {
      setEstimatedCost(null)
    }
  }, [selectedRegionId, cartWeight, btsData])

  // Get points for selected region
  const selectedRegionPoints = useMemo(() => {
    if (!btsData || !selectedRegionId) return []
    const region = btsData.regions.find((r) => r.id === selectedRegionId)
    return region?.points || []
  }, [btsData, selectedRegionId])

  // Get selected region and point data
  const selectedRegion = useMemo(
    () => btsData?.regions.find((r) => r.id === selectedRegionId),
    [btsData, selectedRegionId]
  )
  const selectedPoint = useMemo(
    () => selectedRegionPoints.find((p) => p.id === selectedPointId),
    [selectedRegionPoints, selectedPointId]
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!phone || !firstName || !lastName) {
      setError(t("fill_required_fields"))
      return
    }
    if (!selectedRegionId || !selectedPointId) {
      setError(t("select_delivery_point"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const backendUrl = (
        process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
      ).replace(/\/$/, "")
      const publishableKey =
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

      // Generate email from phone
      const cleanPhone = phone.replace(/\D/g, "")
      const email = `${cleanPhone}@phone.local`

      // Prepare address data
      const addressData = {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        address_1: selectedPoint?.address || "",
        city: selectedRegion?.nameRu || "",
        province: selectedRegion?.nameRu || "",
        country_code: "uz",
        postal_code: "100000",
      }

      // Update cart with address
      const { sdk } = await import("@lib/config")
      await sdk.store.cart.update(cart!.id, {
        shipping_address: addressData,
        billing_address: addressData,
        email,
        metadata: {
          ...cart?.metadata,
          bts_delivery: {
            region: selectedRegion?.nameRu,
            region_id: selectedRegionId,
            point: selectedPoint?.name,
            point_id: selectedPointId,
            point_address: selectedPoint?.address,
            estimated_cost: estimatedCost,
          },
        },
      })

      // Set shipping method
      if (btsMethodId) {
        try {
          const { setShippingMethod } = await import("@lib/data/cart")
          await setShippingMethod({
            cartId: cart!.id,
            shippingMethodId: btsMethodId,
          })
        } catch (shippingErr: any) {
          // If standard method fails, use BTS custom endpoint
          if (
            shippingErr.message?.toLowerCase().includes("do not have a price") ||
            shippingErr.message?.toLowerCase().includes("does not have a price")
          ) {
            const resp = await fetch(`${backendUrl}/store/bts/shipping-method`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-publishable-api-key": publishableKey,
              },
              body: JSON.stringify({
                cart_id: cart!.id,
                shipping_option_id: btsMethodId,
                amount: estimatedCost || 0,
              }),
            })

            if (!resp.ok) {
              throw new Error("Failed to set BTS shipping method")
            }
          } else {
            throw shippingErr
          }
        }
      }

      // Navigate to payment step
      router.push(pathname + "?step=payment", { scroll: false })
      router.refresh()
    } catch (err: any) {
      console.error("Submit error:", err)
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const isCompleted =
    cart?.shipping_address &&
    (cart?.shipping_methods?.length ?? 0) > 0 &&
    cart.metadata?.bts_delivery

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-4 px-2">
        <Heading
          level="h2"
          className="text-xl font-bold text-gray-900 flex items-center gap-2"
        >
          {!isOpen && isCompleted && <CheckCircleSolid className="text-green-500" />}
          {t("shipping_information") as string}
        </Heading>
        {!isOpen && isCompleted && (
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors flex items-center gap-1 group"
            data-testid="edit-address-button"
          >
            <svg
              className="w-4 h-4 group-hover:rotate-12 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            {t("edit") as string}
          </button>
        )}
      </div>

      {isOpen ? (
        <form onSubmit={handleSubmit} className="pb-4">
          <div className="flex flex-col gap-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 gap-4">
              <PhoneInput
                label={t("phone")}
                name="phone"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                data-testid="shipping-phone-input"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t("first_name")}
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  data-testid="shipping-first-name-input"
                />
                <Input
                  label={t("last_name")}
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  data-testid="shipping-last-name-input"
                />
              </div>
            </div>

            {/* Delivery Type Info */}
            <div className="flex flex-col gap-3">
              <Label className="text-gray-500 text-xs uppercase tracking-wider font-bold">
                {t("delivery_type")}
              </Label>
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 border border-blue-50">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900">{t("bts_pickup")}</div>
                  <div className="text-xs text-gray-500">{t("bts_delivery_info")}</div>
                </div>
              </div>
            </div>

            {/* BTS Region & Point Selection */}
            <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-6 bg-blue-50/50 border-b border-blue-100">
                <Label className="text-blue-500 text-xs uppercase tracking-wider font-semibold mb-1">
                  {t("bts_select_region")}
                </Label>
                <Select
                  onValueChange={(val) => {
                    setSelectedRegionId(val)
                    setSelectedPointId("")
                  }}
                  value={selectedRegionId}
                >
                  <Select.Trigger className="w-full min-w-[200px] border-none bg-transparent shadow-none p-0 h-auto text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors focus:ring-0">
                    <Select.Value placeholder={t("bts_region_placeholder")} />
                  </Select.Trigger>
                  <Select.Content>
                    {btsData?.regions.map((region) => (
                      <Select.Item key={region.id} value={region.id}>
                        {region.nameRu}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              {selectedRegionId && (
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                      {t("bts_select_point")}
                    </Label>
                    <Select onValueChange={setSelectedPointId} value={selectedPointId}>
                      <Select.Trigger className="w-full bg-white border border-gray-200 h-12 rounded-lg px-4 text-gray-900 focus:border-blue-500 transition-colors">
                        <Select.Value placeholder={t("bts_point_placeholder")} />
                      </Select.Trigger>
                      <Select.Content>
                        {selectedRegionPoints.map((point) => (
                          <Select.Item key={point.id} value={point.id}>
                            <span className="font-medium text-sm">{point.name}</span>
                            <div className="text-gray-400 text-xs mt-0.5">
                              {point.address}
                            </div>
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </div>

                  {estimatedCost !== null && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400">
                          {t("bts_estimated_cost")}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {convertToLocale({
                            amount: estimatedCost,
                            currency_code: cart?.currency_code || "UZS",
                          })}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                        {t("bts_payment_on_delivery")}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full h-12 rounded-xl text-base font-bold shadow-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="submit-address-button"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t("processing")}
              </span>
            ) : (
              t("continue")
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {isCompleted && cart ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-100">
              <div className="space-y-4">
                <div data-testid="shipping-address-summary">
                  <Text className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">
                    {t("recipient")}
                  </Text>
                  <Text className="text-base font-semibold text-gray-900 leading-tight">
                    {cart.shipping_address?.first_name} {cart.shipping_address?.last_name}
                  </Text>
                  <Text className="text-sm text-gray-600 font-medium">
                    {cart.shipping_address?.phone}
                  </Text>
                </div>
              </div>

              <div className="space-y-4">
                {cart.metadata?.bts_delivery && (
                  <div>
                    <Text className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">
                      {t("bts_delivery_point")}
                    </Text>
                    <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <Text className="text-sm font-bold text-gray-900">
                          {(cart.metadata.bts_delivery as any).region}
                        </Text>
                      </div>
                      <Text className="text-xs text-gray-500 font-medium line-clamp-2">
                        {(cart.metadata.bts_delivery as any).point}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ContactAndDelivery
