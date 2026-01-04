"use client"

import { useTranslations } from "next-intl"

type ProductUseCasesProps = {
  useCases: string[]
  showTitle?: boolean
}

/**
 * Renders product use cases as pill badges.
 * Returns null if no use cases provided.
 */
const ProductUseCases = ({ 
  useCases,
  showTitle = true 
}: ProductUseCasesProps) => {
  const t = useTranslations("product")
  
  if (!useCases || useCases.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <h3 className="text-base font-semibold text-gray-900">
          {t("use_cases")}
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {useCases.map((useCase, idx) => (
          <span 
            key={idx} 
            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100"
          >
            {useCase}
          </span>
        ))}
      </div>
    </div>
  )
}

export default ProductUseCases
