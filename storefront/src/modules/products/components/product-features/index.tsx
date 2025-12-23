"use client"

import { useTranslations } from "next-intl"

type ProductFeaturesProps = {
  features: string[]
  maxItems?: number
  showTitle?: boolean
}

/**
 * Renders product features as a bulleted list.
 * Returns null if no features provided.
 */
const ProductFeatures = ({ 
  features, 
  maxItems,
  showTitle = true 
}: ProductFeaturesProps) => {
  const t = useTranslations("product")
  
  if (!features || features.length === 0) {
    return null
  }

  const displayedFeatures = maxItems ? features.slice(0, maxItems) : features

  return (
    <div className="space-y-3">
      {showTitle && (
        <h3 className="text-base font-semibold text-gray-900">
          {t("features")}
        </h3>
      )}
      <ul className="space-y-2">
        {displayedFeatures.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
            <svg 
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProductFeatures
