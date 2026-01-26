"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { usePickupPoint } from "@lib/context/pickup-point-context"

interface PickupPointSelectorProps {
  locale: string
  variant?: "mobile" | "desktop"
}

export default function PickupPointSelector({ locale, variant = "mobile" }: PickupPointSelectorProps) {
  const t = useTranslations("nav")
  const router = useRouter()
  const params = useParams()
  const { selectedPoint } = usePickupPoint()

  const displayText = selectedPoint
    ? selectedPoint.name
    : t("pickup_point") || "Пункт выдачи"

  const fullTitle = selectedPoint
    ? `${selectedPoint.regionName}, ${selectedPoint.name}`
    : displayText

  const handleClick = () => {
    router.push(`/${locale}/${params.countryCode}/pickup-points`)
  }

  // Desktop variant for TopBar (dark background)
  if (variant === "desktop") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
          selectedPoint
            ? "text-red-400 hover:text-red-300"
            : "text-white hover:text-red-400"
        }`}
        title={fullTitle}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="max-w-[200px] truncate text-sm font-medium">
          {displayText}
        </span>
        {selectedPoint && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 text-red-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    )
  }

  // Mobile variant (light background) - Compact design to avoid logo overlap
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-0.5 px-1.5 py-1 text-[10px] sm:text-xs font-medium transition-all max-w-[100px] xs:max-w-[120px] truncate rounded ${
        selectedPoint
          ? "text-red-600 hover:text-red-700 bg-red-50"
          : "text-gray-700 hover:text-red-600"
      }`}
      title={fullTitle}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 min-w-[12px]"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span className="truncate min-w-0">{displayText}</span>
      {selectedPoint && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 text-red-600 min-w-[10px]"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 min-w-[8px]"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
