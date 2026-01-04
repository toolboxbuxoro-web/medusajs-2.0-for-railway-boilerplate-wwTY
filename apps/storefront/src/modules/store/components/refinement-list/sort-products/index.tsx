"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import { useTranslations } from 'next-intl'

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
  compact?: boolean
}

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
  compact = false,
}: SortProductsProps) => {
  const t = useTranslations('store')
  
  const sortOptions = [
    {
      value: "created_at",
      label: t('latest_arrivals'),
    },
    {
      value: "price_asc",
      label: t('price_low_high'),
    },
    {
      value: "price_desc",
      label: t('price_high_low'),
    },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQueryParams("sortBy", e.target.value as SortOptions)
  }

  // Compact mode for mobile - dropdown select
  if (compact) {
    return (
      <select
        value={sortBy}
        onChange={handleChange}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        data-testid={dataTestId}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  // Desktop mode - radio group
  return (
    <FilterRadioGroup
      title={t('sort_by')}
      items={sortOptions}
      value={sortBy}
      handleChange={(value: string) => setQueryParams("sortBy", value as SortOptions)}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
