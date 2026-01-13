import { HttpTypes } from "@medusajs/types"
import { Container, Select, Label, Text, clx, Heading } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import PhoneInput from "@modules/common/components/phone-input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import { useTranslations } from 'next-intl'
import { BTS_REGIONS, calculateBtsCost, getBtsPointsByRegion } from "@lib/data/bts"
import { convertToLocale } from "@lib/util/money"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  availableShippingMethods,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  availableShippingMethods?: HttpTypes.StoreCartShippingOption[]
}) => {
  const t = useTranslations('checkout')

  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.country_code": "uz",
    "shipping_address.postal_code": "100000",
    "shipping_address.province": "Uzbekistan",
    "shipping_address.city": "Tashkent",
    "shipping_address.address_1": "",
  })

  // BTS State
  const [selectedRegionId, setSelectedRegionId] = useState<string>("")
  const [selectedPointId, setSelectedPointId] = useState<string>("")
  const [estimatedBtsCost, setEstimatedBtsCost] = useState<number | null>(null)
  
  // Shipping Method State
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    cart?.shipping_methods?.at(-1)?.shipping_option_id || ""
  )

  useEffect(() => {
    if (!availableShippingMethods?.length) {
      return
    }

    // If current selection exists in available methods, keep it.
    if (selectedMethodId && availableShippingMethods.some((m) => m.id === selectedMethodId)) {
      return
    }

    // Prefer BTS method; fallback to the first available option.
    const btsMethod = availableShippingMethods.find((m) =>
      (m.name || "").toLowerCase().includes("bts")
    )
    const methodToUse = btsMethod || availableShippingMethods[0]

    if (methodToUse?.id) {
      setSelectedMethodId(methodToUse.id)
    }
  }, [availableShippingMethods, selectedMethodId])

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const cartWeight = useMemo(() => {
    return cart?.items?.reduce((acc, item) => {
      const weightRaw = 
        item.variant?.weight || 
        (item as any).product?.weight || 
        (item.variant as any)?.product?.weight || 
        0
      const weightNum = typeof weightRaw === 'string' ? parseFloat(weightRaw) : Number(weightRaw)
      const weight = isNaN(weightNum) ? 0 : weightNum
      return acc + (weight * item.quantity)
    }, 0) || 0
  }, [cart?.items])

  useEffect(() => {
    if (selectedRegionId) {
      const effectiveWeight = cartWeight > 0 ? cartWeight : 1000
      const weightInKg = effectiveWeight / 1000 
      const cost = calculateBtsCost(weightInKg, selectedRegionId)
      setEstimatedBtsCost(cost)
      
      const region = BTS_REGIONS.find(r => r.id === selectedRegionId)
      if (region) {
        setFormData(prev => ({
          ...prev,
          "shipping_address.city": region.nameRu,
          "shipping_address.province": region.nameRu,
        }))
      }
    } else {
      setEstimatedBtsCost(null)
    }
  }, [selectedRegionId, cartWeight])

  useEffect(() => {
    if (selectedPointId) {
      const region = BTS_REGIONS.find(r => r.id === selectedRegionId)
      const point = region?.points.find(p => p.id === selectedPointId)
      if (point) {
        setFormData(prev => ({
          ...prev,
          "shipping_address.address_1": point.address,
        }))
      }
    }
  }, [selectedPointId, selectedRegionId])

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    address &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.phone": address?.phone || "",
        "shipping_address.city": address?.city || "Tashkent",
        "shipping_address.country_code": address?.country_code || "uz",
        "shipping_address.postal_code": address?.postal_code || "100000",
        "shipping_address.province": address?.province || "Uzbekistan",
      }))

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  useEffect(() => {
    if (cart && cart.shipping_address) {
      setFormAddress(cart.shipping_address, cart.email)
      const btsData = (cart.metadata?.bts_delivery as any)
      if (btsData?.region_id) {
        setSelectedRegionId(btsData.region_id)
        if (btsData?.point_id) {
          setSelectedPointId(btsData.point_id)
        }
      }
    }
  }, [cart])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5 bg-gray-50/50 border-gray-100 border">
          <p className="text-small-regular font-medium text-gray-500">
            {t('saved_address_prompt', { name: customer.first_name || "" })}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}

      {/* Mandatory ID fields (Hidden) */}
      <input type="hidden" name="shipping_address.country_code" value={formData["shipping_address.country_code"]} />
      <input type="hidden" name="shipping_address.postal_code" value={formData["shipping_address.postal_code"]} />
      <input type="hidden" name="shipping_address.city" value={formData["shipping_address.city"]} />
      <input type="hidden" name="shipping_address.province" value={formData["shipping_address.province"]} />
      <input type="hidden" name="email" value={formData.email || ""} />

      {/**
       * BTS is the only supported delivery mode in this storefront UI.
       * We keep the actual values as inputs so server action (`setAddresses`) can
       * set cart metadata + shipping method. We use sr-only required inputs so
       * the user can't submit without picking a region/point and having a method id.
       */}
      <input
        name="bts_region_id"
        value={selectedRegionId}
        readOnly
        required
        className="sr-only"
        tabIndex={-1}
      />
      <input
        name="bts_point_id"
        value={selectedPointId}
        readOnly
        required
        className="sr-only"
        tabIndex={-1}
      />
      <input
        type="hidden"
        name="bts_estimated_cost"
        value={estimatedBtsCost || ""}
      />

      <input
        name="shipping_method_id"
        value={selectedMethodId}
        readOnly
        required
        className="sr-only"
        tabIndex={-1}
      />

      {/* Required address_1 surrogate for BTS mode (it's set from selected BTS point) */}
      <input
        name="shipping_address.address_1"
        value={formData["shipping_address.address_1"] || ""}
        readOnly
        required
        className="sr-only"
        tabIndex={-1}
      />

      <div className="flex flex-col gap-y-6">
        <div className="grid grid-cols-1 gap-4">
          <PhoneInput
            label={t('phone')}
            name="shipping_address.phone"
            autoComplete="tel"
            value={formData["shipping_address.phone"]}
            onChange={handleChange}
            required
            data-testid="shipping-phone-input"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
                label={t('first_name')}
                name="shipping_address.first_name"
                autoComplete="given-name"
                value={formData["shipping_address.first_name"]}
                onChange={handleChange}
                required
                data-testid="shipping-first-name-input"
            />
            <Input
                label={t('last_name')}
                name="shipping_address.last_name"
                autoComplete="family-name"
                value={formData["shipping_address.last_name"]}
                onChange={handleChange}
                required
                data-testid="shipping-last-name-input"
            />
          </div>
        </div>

        {/* Delivery Method Toggle - Removed as only BTS is supported for now */}
        <div className="flex flex-col gap-3">
             <Label className="text-gray-500 text-xs uppercase tracking-wider font-bold">{t("delivery_type")}</Label>
             <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-600 border border-blue-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <div>
                    <div className="font-bold text-gray-900">{t("bts_pickup")}</div>
                    <div className="text-xs text-gray-500">{t("bts_delivery_info")}</div>
                </div>
             </div>
        </div>
        
        <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-4 sm:p-6 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
                <div>
                    <Label className="text-blue-500 text-xs uppercase tracking-wider font-semibold mb-1">{t("bts_select_region")}</Label>
                    <Select
                      onValueChange={(val) => {
                        setSelectedRegionId(val)
                        setSelectedPointId("")
                        setFormData((prev) => ({
                          ...prev,
                          "shipping_address.address_1": "",
                        }))
                      }}
                      value={selectedRegionId}
                    >
                        <Select.Trigger className="w-full min-w-[200px] border-none bg-transparent shadow-none p-0 h-auto text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors focus:ring-0">
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
            </div>

            {selectedRegionId && (
                <div className="p-4 sm:p-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-gray-500 text-xs uppercase tracking-wider font-semibold">{t("bts_select_point")}</Label>
                        <Select onValueChange={setSelectedPointId} value={selectedPointId}>
                            <Select.Trigger className="w-full bg-white border border-gray-200 h-12 rounded-lg px-4 text-gray-900 focus:border-blue-500 transition-colors">
                                <Select.Value placeholder={t("bts_point_placeholder")} />
                            </Select.Trigger>
                            <Select.Content>
                                {getBtsPointsByRegion(selectedRegionId).map((point) => (
                                <Select.Item key={point.id} value={point.id}>
                                    <span className="font-medium text-sm">{point.name}</span>
                                    <div className="text-gray-400 text-xs mt-0.5">{point.address}</div>
                                </Select.Item>
                                ))}
                            </Select.Content>
                        </Select>
                    </div>

                    {estimatedBtsCost !== null && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-gray-400">{t("bts_estimated_cost")}</span>
                                <span className="text-lg font-bold text-gray-900">
                                    {convertToLocale({
                                        amount: estimatedBtsCost,
                                        currency_code: cart?.currency_code
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

      <div className="hidden">
        {/* We keep this hidden but checked to satisfy any logic that depends on it */}
        <input type="checkbox" name="same_as_billing" checked={true} readOnly />
      </div>
    </>
  )
}

const Divider = ({ className }: { className?: string }) => (
  <div className={clx("h-px w-full bg-ui-border-base", className)} />
)

export default ShippingAddress
