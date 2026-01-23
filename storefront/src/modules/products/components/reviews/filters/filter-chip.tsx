"use client"

import React from "react"
import { clx } from "@medusajs/ui"

interface FilterChipProps {
  active: boolean
  onClick: () => void
  label: string
  fullWidth?: boolean
}

const FilterChip: React.FC<FilterChipProps> = ({
  active,
  onClick,
  label,
  fullWidth = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={clx(
        "px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
        active
          ? "bg-red-600 text-white shadow-sm hover:bg-red-700"
          : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50",
        fullWidth && "w-full text-left"
      )}
    >
      {label}
    </button>
  )
}

export default FilterChip
