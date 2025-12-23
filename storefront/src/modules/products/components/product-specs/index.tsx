"use client"

import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import { useState } from "react"

type ProductSpecsProps = {
  product: HttpTypes.StoreProduct
  maxItems?: number
}

// Helper to extract specs from product metadata
const getProductSpecs = (product: HttpTypes.StoreProduct): { label: string; value: string }[] => {
  const specs: { label: string; value: string }[] = []
  const metadata = (product.metadata || {}) as Record<string, any>
  
  // 1. Structured Specifications (New Model - Priority)
  // Logic: metadata.specifications = { "Label": "Value" }
  if (metadata.specifications && typeof metadata.specifications === "object") {
    Object.entries(metadata.specifications).forEach(([label, value]) => {
      if (value && typeof value === "string" && value !== "-") {
        specs.push({ label, value })
      }
    })
  }

  // 2. Legacy Flat Metadata Fallback
  // Only add if not already present in specs (e.g. during migration)
  const legacySpecFields = [
    { key: "battery_type", label: "Тип аккумулятора" },
    { key: "voltage", label: "Напряжение" },
    { key: "power", label: "Мощность" },
    { key: "max_torque", label: "Макс. крутящий момент" },
    { key: "drilling_diameter_metal", label: "Макс диаметр сверления (металл)" },
    { key: "drilling_diameter_wood", label: "Макс диаметр сверления (дерево)" },
    { key: "charger_included", label: "Зарядное устройство в комплекте" },
    { key: "weight", label: "Вес нетто" },
    { key: "brand", label: "Бренд" },
    { key: "manufacturer", label: "Производитель" },
    { key: "country", label: "Страна производства" },
    { key: "warranty", label: "Гарантия" },
  ]

  legacySpecFields.forEach(({ key, label }) => {
    // Check if this label was already added via structured specs
    const alreadyAdded = specs.some(s => s.label.toLowerCase() === label.toLowerCase())
    
    if (!alreadyAdded) {
      const value = metadata[key]
      if (value && typeof value === "string" && value !== "-") {
        specs.push({ label, value })
      }
    }
  })

  // 3. Standard Medusa Product Fields (Core)
  if (product.material) {
    specs.push({ label: "Материал", value: product.material })
  }
  if (product.weight) {
    specs.push({ label: "Вес", value: `${product.weight} г` })
  }
  if (product.origin_country) {
    specs.push({ label: "Страна происхождения", value: product.origin_country })
  }
  if (product.type?.value) {
    specs.push({ label: "Тип", value: product.type.value })
  }

  return specs
}

const ProductSpecs = ({ product, maxItems = 6 }: ProductSpecsProps) => {
  const t = useTranslations("product")
  const [showAll, setShowAll] = useState(false)
  
  const allSpecs = getProductSpecs(product)
  const displayedSpecs = showAll ? allSpecs : allSpecs.slice(0, maxItems)
  const hasMore = allSpecs.length > maxItems

  if (allSpecs.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Specs List */}
      <div className="space-y-2">
        {displayedSpecs.map((spec, idx) => (
          <div key={idx} className="flex items-baseline gap-2 text-sm">
            <span className="text-gray-500 flex-shrink-0">{spec.label}:</span>
            <span className="text-gray-900 font-medium">{spec.value}</span>
          </div>
        ))}
      </div>

      {/* Show All Link */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
        >
          {showAll ? "Скрыть" : "Все характеристики"}
          <svg
            className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default ProductSpecs
