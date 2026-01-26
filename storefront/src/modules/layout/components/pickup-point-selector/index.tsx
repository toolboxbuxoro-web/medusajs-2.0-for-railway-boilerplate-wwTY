"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { usePickupPoint } from "@lib/context/pickup-point-context"

interface PickupPointSelectorProps {
  locale: string
}

export default function PickupPointSelector({ locale }: PickupPointSelectorProps) {
  const t = useTranslations("nav")
  const router = useRouter()
  const params = useParams()
  const { selectedPoint } = usePickupPoint()

  const displayText = selectedPoint
    ? selectedPoint.name
    : t("pickup_point") || "Пункт выдачи"

  const handleClick = () => {
    router.push(`/${locale}/${params.countryCode}/pickup-points`)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 hover:text-red-600 transition-colors max-w-[140px] truncate"
      title={selectedPoint ? `${selectedPoint.regionName}, ${selectedPoint.name}` : displayText}
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
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span className="truncate">{displayText}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}
