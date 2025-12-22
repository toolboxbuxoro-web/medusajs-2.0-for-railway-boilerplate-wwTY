"use client"

import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"

import Accordion from "./accordion"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const t = useTranslations("product")
  const tabs = [
    {
      label: t("product_info"),
      component: <ProductInfoTab product={product} />,
    },
    {
      label: t("pickup_and_returns"),
      component: <PickupAndReturnsTab />,
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const t = useTranslations("product")
  
  // Only show fields that have actual values (not "-" or empty)
  const hasValue = (val: string | null | undefined) => val && val !== "-" && val.trim() !== ""
  
  const specs = [
    { label: t("material"), value: product.material },
    { label: t("country_of_origin"), value: product.origin_country },
    { label: t("type"), value: product.type?.value },
    { label: t("weight"), value: product.weight ? `${product.weight} г` : null },
    { 
      label: t("dimensions"), 
      value: product.length && product.width && product.height 
        ? `${product.length}L x ${product.width}W x ${product.height}H` 
        : null 
    },
  ].filter(spec => hasValue(spec.value))
  
  if (specs.length === 0) {
    return null
  }
  
  return (
    <div className="text-small-regular py-6">
      <div className="grid grid-cols-1 gap-y-3">
        {specs.map((spec, idx) => (
          <div key={idx} className="flex items-baseline gap-2">
            <span className="text-gray-500 min-w-[140px]">{spec.label}:</span>
            <span className="text-gray-900 font-medium">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PickupAndReturnsTab = () => {
  const t = useTranslations("product")
  return (
    <div className="text-small-regular py-6">
      <div className="grid grid-cols-1 gap-y-6">
        {/* BTS Pickup */}
        <div className="flex items-start gap-x-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-gray-900">{t("bts_pickup_title")}</span>
            <p className="text-gray-600 mt-1">{t("bts_pickup_desc")}</p>
          </div>
        </div>
        
        {/* Same Day */}
        <div className="flex items-start gap-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-gray-900">{t("bts_same_day")}</span>
            <p className="text-gray-600 mt-1">{t("bts_same_day_desc")}</p>
          </div>
        </div>
        
        {/* Return Policy */}
        <div className="flex items-start gap-x-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-gray-900">{t("return_policy")}</span>
            <p className="text-gray-600 mt-1">{t("return_policy_desc")}</p>
          </div>
        </div>
        
        {/* Warranty */}
        <div className="flex items-start gap-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-gray-900">{t("warranty_info")}</span>
            <p className="text-gray-600 mt-1">{t("warranty_info_desc")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
