"use client"

import { HttpTypes } from "@medusajs/types"
import { Container, Select, Label, Text, Heading } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import PhoneInput from "@modules/common/components/phone-input"
import React, { useEffect, useMemo, useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { usePickupPoint } from "@lib/context/pickup-point-context"
import { useParams } from "next/navigation"

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

// Calculate BTS cost using backend API
const calculateBtsCost = async (
  weightKg: number,
  regionId: string
): Promise<number> => {
  try {
    const backendUrl = (
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    ).replace(/\/$/, "")
    const publishableKey =
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    const response = await fetch(`${backendUrl}/store/bts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": publishableKey,
      },
      body: JSON.stringify({
        weight_kg: weightKg,
        region_id: regionId,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.cost
    }
  } catch (err) {
    console.error("Failed to calculate BTS cost via API:", err)
  }
  return 0
}

interface ContactAndDeliveryProps {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  availableShippingMethods?: HttpTypes.StoreCartShippingOption[]
  initialBtsData?: BtsData
}

const ContactAndDelivery: React.FC<ContactAndDeliveryProps> = ({
  cart,
  customer,
  availableShippingMethods,
  initialBtsData,
}) => {
  const t = useTranslations("checkout")
  const tAccount = useTranslations("account")
  const tErrors = useTranslations("errors")

  // Helper to translate OTP error keys
  const translateOtpError = (errorKey: string): string => {
    const errorMap: Record<string, string> = {
      "failed_to_send_otp": tErrors("failed_to_send_otp"),
      "otp_cooldown": tErrors("otp_cooldown"),
      "invalid_code": tErrors("invalid_code"),
      "too_many_requests": tErrors("too_many_requests"),
      "invalid_phone": tErrors("invalid_phone"),
      "account_exists": tErrors("account_exists"),
      "Network error": tErrors("error_occurred"),
      "Login failed": tErrors("invalid_credentials"),
      "Invalid code": tErrors("invalid_code"),
      "Failed to send code": tErrors("failed_to_send_otp"),
    }
    return errorMap[errorKey] || errorKey
  }
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const locale = (params.locale as string) || "ru"
  const { selectedPoint: globalPickupPoint, setSelectedPoint: setGlobalPickupPoint } = usePickupPoint()

  const isCompleted =
    !!cart?.shipping_address?.address_1 &&
    (cart?.shipping_methods?.length ?? 0) > 0

  useEffect(() => {
    console.log("[ContactAndDelivery] Status:", {
      address_1: cart?.shipping_address?.address_1,
      methods: cart?.shipping_methods?.length,
      isCompleted,
      step: searchParams.get("step")
    })
  }, [cart, isCompleted, searchParams])

  const isOpen = 
    ["address", "delivery", "shipping"].includes(searchParams.get("step") || "") || 
    (!searchParams.get("step") && !isCompleted)

  // Form state
  const [phone, setPhone] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  // BTS state - Initialize with prop data if available
  console.log('[ContactAndDelivery] initialBtsData:', initialBtsData ? `Regions: ${initialBtsData.regions?.length}` : 'null')
  const [btsData, setBtsData] = useState<BtsData | null>(initialBtsData || null)
  const [selectedRegionId, setSelectedRegionId] = useState("")
  const [selectedPointId, setSelectedPointId] = useState("")
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Track if user has manually edited the selection to prevent overwriting
  const userEditedPickupRef = useRef(false)

  // OTP verification state (for guests)
  const [otpCode, setOtpCode] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  // Check if user is logged in
  const isLoggedIn = !!customer?.id

  // Get BTS shipping method ID
  const btsMethodId = useMemo(() => {
    const btsMethod = availableShippingMethods?.find((m) =>
      (m.name || "").toLowerCase().includes("bts")
    )
    return btsMethod?.id || availableShippingMethods?.[0]?.id || ""
  }, [availableShippingMethods])

  // Fallback: If no initial data, load static fallback (we removed client fetch to save requests)
  useEffect(() => {
    if (!btsData) {
       console.log("[ContactAndDelivery] No initialBtsData, loading fallback")
       import("@lib/data/bts")
        .then((mod) => {
          setBtsData({
            regions: mod.BTS_REGIONS as unknown as BtsRegion[],
            pricing: mod.BTS_PRICING
          })
        })
        .catch((err) => {
          console.error('[ContactAndDelivery] Failed to load BTS fallback:', err)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialize form with customer data (for logged-in) or localStorage/cart data (for guests)
  useEffect(() => {
    // 1. For logged-in users: prioritize customer profile data for phone/name
    if (isLoggedIn && customer) {
      if (customer.phone) setPhone(customer.phone)
      if (customer.first_name) setFirstName(customer.first_name)
      if (customer.last_name) setLastName(customer.last_name)
    } else {
      // 2. For guests: try localStorage first (for OTP flow persistence)
      const saved = localStorage.getItem("checkout_form_data")
      if (saved) {
        try {
          const { phone: p, firstName: fn, lastName: ln } = JSON.parse(saved)
          if (p) setPhone(p)
          if (fn) setFirstName(fn)
          if (ln) setLastName(ln)
        } catch (e) {}
      } else if (cart?.shipping_address) {
        setPhone(cart.shipping_address.phone || "")
        setFirstName(cart.shipping_address.first_name || "")
        setLastName(cart.shipping_address.last_name || "")
      }
    }
  }, [cart, customer, isLoggedIn])

  // BTS Selection Logic: Split into Initialization and Sync

  // 1. Initialization Effect (Runs ONCE on mount)
  useEffect(() => {
    let regionId = ""
    let pointId = ""

    // Priority: globalPickupPoint -> localStorage -> cart.metadata
    if (globalPickupPoint) {
      regionId = globalPickupPoint.regionId
      pointId = globalPickupPoint.id
      console.log("[ContactAndDelivery] Init from globalPickupPoint:", { regionId, pointId })
    } else {
      try {
        const saved = localStorage.getItem("selected_pickup_point")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed?.regionId) {
            regionId = parsed.regionId
            pointId = parsed.id
            console.log("[ContactAndDelivery] Init from localStorage:", { regionId, pointId })
          }
        }
      } catch (e) {
        console.error("[ContactAndDelivery] Failed to read from localStorage:", e)
      }
    }

    // Fallback to cart metadata if still empty
    if (!regionId && cart?.metadata?.bts_delivery) {
      const btsDelivery = cart.metadata.bts_delivery as any
      regionId = btsDelivery.region_id || ""
      pointId = btsDelivery.point_id || ""
      console.log("[ContactAndDelivery] Init from cart metadata:", { regionId, pointId })
    }

    if (regionId) setSelectedRegionId(regionId)
    if (pointId) setSelectedPointId(pointId)
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount

  // 2. Sync Effect (Runs when context changes)
  // Only sync if user hasn't manually edited the form
  useEffect(() => {
    if (userEditedPickupRef.current) {
      console.log("[ContactAndDelivery] Skipping sync from context (user edited)")
      return
    }

    if (globalPickupPoint) {
      console.log("[ContactAndDelivery] Syncing from context:", globalPickupPoint)
      // Verify region exists to prevent invalid state
      if (btsData?.regions && !btsData.regions.find(r => r.id === globalPickupPoint.regionId)) {
        console.warn(`[ContactAndDelivery] Context region ${globalPickupPoint.regionId} not found in btsData`)
        return
      }
      
      setSelectedRegionId(globalPickupPoint.regionId)
      setSelectedPointId(globalPickupPoint.id)
    }
  }, [globalPickupPoint, btsData])

  // Save to localStorage whenever fields change
  useEffect(() => {
    if (phone || firstName || lastName) {
      localStorage.setItem("checkout_form_data", JSON.stringify({ phone, firstName, lastName }))
    }
  }, [phone, firstName, lastName])

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
    const updateCost = async () => {
      if (selectedRegionId && btsData) {
        const effectiveWeight = cartWeight > 0 ? cartWeight : 1000
        const weightInKg = effectiveWeight / 1000
        const cost = await calculateBtsCost(
          weightInKg,
          selectedRegionId
        )
        setEstimatedCost(cost)
      } else {
        setEstimatedCost(null)
      }
    }
    updateCost()
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

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!phone || !firstName || !lastName) {
      setError(t("fill_required_fields"))
      return
    }
    
    // Guests must login via OTP before proceeding
    if (!isLoggedIn && !otpVerified) {
      setError(tAccount("otp_please_verify"))
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
        const { setShippingMethod } = await import("@lib/data/cart")
        await setShippingMethod({
          cartId: cart!.id,
          shippingMethodId: btsMethodId,
          amount: 0, // Delivery is paid strictly on arrival, so 0 in the Medusa check
        })
      }

      // Auto-register removed. OTP Login is now enforced above.
      console.log("[Checkout] Address submitted. isLoggedIn:", isLoggedIn, "otpVerified:", otpVerified)

      // Navigate to payment step
      // Navigate to payment step
      router.push(pathname + "?step=payment", { scroll: false })
      router.refresh()
      
      // Reset dirty flag after successful submit
      userEditedPickupRef.current = false
    } catch (err: any) {
      console.error("Submit error:", err)
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
      // Clear localStorage on success (when step changes to payment)
      if (!error) {
        localStorage.removeItem("checkout_form_data")
      }
    }
  }



  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-4 px-2">
        <Heading
          level="h2"
          className="text-xl font-bold text-gray-900 flex items-center gap-2"
        >
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
          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
              <span className="text-sm font-medium text-blue-600">{t("step_contact")}</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">2</div>
              <span className="text-sm font-medium text-gray-500">{t("step_delivery")}</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
              <span className="text-sm font-medium text-gray-500">{t("step_payment")}</span>
            </div>
          </div>

          <div className="flex flex-col gap-y-6">
            {/* Recipient Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">{t("enter_your_details")}</span>
              </div>
              
              {/* Name fields FIRST */}
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

              {/* Phone input SECOND */}
              <PhoneInput
                label={t("phone")}
                name="phone"
                autoComplete="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  // Reset OTP state when phone changes
                  if (otpSent) {
                    setOtpSent(false)
                    setOtpVerified(false)
                    setOtpCode("")
                  }
                }}
                required
                disabled={otpVerified || isLoggedIn}
                data-testid="shipping-phone-input"
              />

              {/* OTP Login for guests - with explanation */}
              {!isLoggedIn && phone.length >= 9 && (
                <div className="space-y-3">
                  {/* Explanation text */}
                  {!otpVerified && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-700">
                        {t("login_to_track")}
                      </p>
                    </div>
                  )}
                  
                  {!otpVerified ? (
                    <>
                      {!otpSent ? (
                        <button
                          type="button"
                          onClick={async () => {
                            setOtpLoading(true)
                            setOtpError(null)
                            try {
                              const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
                              const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
                              const resp = await fetch(`${backendUrl}/store/mobile/auth/request-otp`, {
                                method: "POST",
                                headers: { 
                                  "Content-Type": "application/json",
                                  "x-publishable-api-key": publishableKey
                                },
                                body: JSON.stringify({ phone })
                              })
                              const data = await resp.json()
                              if (resp.ok && data.success) {
                                setOtpSent(true)
                                setResendTimer(60)
                              } else {
                                setOtpError(translateOtpError(data.error || "Failed to send code"))
                              }
                            } catch (e) {
                              setOtpError(translateOtpError("Network error"))
                            }
                            setOtpLoading(false)
                          }}
                          disabled={otpLoading}
                          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-md"
                        >
                          {otpLoading ? tAccount("otp_sending") : tAccount("otp_get_code")}
                        </button>
                      ) : (
                        <div className="space-y-3 animation-fade-in">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder={tAccount("otp_enter_code")}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-center text-xl tracking-widest font-mono focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              data-testid="checkout-otp-input"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                setOtpLoading(true)
                                setOtpError(null)
                                try {
                                  const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
                                  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
                                  const resp = await fetch(`${backendUrl}/store/mobile/auth/verify-otp`, {
                                    method: "POST",
                                    headers: { 
                                      "Content-Type": "application/json",
                                      "x-publishable-api-key": publishableKey
                                    },
                                    body: JSON.stringify({ phone, code: otpCode })
                                  })
                                  const data = await resp.json()
                                  
                                  if (resp.ok && data.token) {
                                    const { loginWithOtpToken } = await import("@lib/data/customer")
                                    const result = await loginWithOtpToken(data.token)
                                    
                                    if (result === "success") {
                                       setOtpVerified(true)
                                       router.refresh()
                                    } else {
                                       setOtpError(translateOtpError("Login failed"))
                                    }
                                  } else {
                                    setOtpError(translateOtpError(data.error || "Invalid code"))
                                  }
                                } catch (e) {
                                  setOtpError(translateOtpError("Network error"))
                                }
                                setOtpLoading(false)
                              }}
                                disabled={otpLoading || otpCode.length < 6}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-md"
                                data-testid="checkout-verify-otp-button"
                            >
                              {otpLoading ? "..." : "✓"}
                            </button>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">{tAccount("otp_code_sent_to", { phone })}</span>
                            {resendTimer > 0 ? (
                              <span className="text-gray-400">{tAccount("otp_resend_in", { seconds: resendTimer })}</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpSent(false)
                                  setOtpCode("")
                                }}
                                className="text-blue-600 hover:underline"
                              >
                                {tAccount("otp_resend")}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {otpError && (
                        <p className="text-red-500 text-sm">{otpError}</p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-200">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{t("verified_success")}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Logged in indicator */}
              {isLoggedIn && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{t("verified_success")}</span>
                </div>
              )}
            </div>

            {/* Delivery Type Info */}
            <div className="flex flex-col gap-3">
              <Label className="text-gray-500 text-xs uppercase tracking-wider font-bold">
                {t("delivery_type") as string}
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
                  <div className="font-bold text-gray-900">{t("bts_pickup") as string}</div>
                  <div className="text-xs text-gray-500">{t("bts_delivery_info") as string}</div>
                </div>
              </div>
            </div>

            {/* BTS Region & Point Selection */}
            <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
              <div className="p-4 sm:p-6 bg-blue-50/50 border-b border-blue-100">
                <Label className="text-blue-500 text-xs uppercase tracking-wider font-semibold mb-1">
                  {t("bts_select_region") as string}
                </Label>
                <Select
                  onValueChange={(val) => {
                    userEditedPickupRef.current = true // Mark as manually edited
                    setSelectedRegionId(val)
                    setSelectedPointId("")
                    // Sync to Global Context
                    if (btsData) {
                      const region = btsData.regions.find(r => r.id === val)
                      if (region) {
                        setGlobalPickupPoint(null) // Clear point when region changes
                      }
                    }
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
                    <Select 
                      onValueChange={(val) => {
                        userEditedPickupRef.current = true // Mark as manually edited
                        setSelectedPointId(val)
                        // Sync to Global Context
                        if (selectedRegionPoints && selectedRegion) {
                          const point = selectedRegionPoints.find(p => p.id === val)
                          if (point && selectedRegion) {
                            setGlobalPickupPoint({
                              id: point.id,
                              name: point.name,
                              address: point.address,
                              regionId: selectedRegion.id,
                              regionName: locale === "ru" ? selectedRegion.nameRu : selectedRegion.name,
                            })
                          }
                        }
                      }} 
                      value={selectedPointId}
                    >
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
                            currency_code: cart?.currency_code || "uzs",
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
            disabled={isLoading || (!isLoggedIn && !otpVerified)}
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
                {t("processing") as string}
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
                    {t("recipient") as string}
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
                {(cart.metadata?.bts_delivery as { region?: string; point?: string } | undefined) && (
                  <div>
                    <Text className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">
                      {t("bts_delivery_point") as string}
                    </Text>
                    <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <Text className="text-sm font-bold text-gray-900">
                          {String((cart.metadata?.bts_delivery as { region?: string })?.region || "")}
                        </Text>
                      </div>
                      <Text className="text-xs text-gray-500 font-medium line-clamp-2">
                        {String((cart.metadata?.bts_delivery as { point?: string })?.point || "")}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex items-center justify-between">
              <Text className="text-orange-600 font-medium">
                {t("incomplete_information") || "Incomplete information"}
              </Text>
              <button 
                onClick={() => router.push(pathname + "?step=address")}
                className="text-orange-700 font-bold hover:underline"
              >
                {t("edit") || "Edit"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ContactAndDelivery
