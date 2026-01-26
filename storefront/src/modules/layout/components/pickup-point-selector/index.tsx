"use client"

import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { usePickupPoint } from "@lib/context/pickup-point-context"
import { BTS_REGIONS, BtsRegion, BtsPoint } from "@lib/data/bts"

interface PickupPointSelectorProps {
  locale: string
}

export default function PickupPointSelector({ locale }: PickupPointSelectorProps) {
  const t = useTranslations("nav")
  const { selectedPoint, setSelectedPoint } = usePickupPoint()
  const [isOpen, setIsOpen] = useState(false)
  const [regions, setRegions] = useState<BtsRegion[]>([])

  useEffect(() => {
    // Загружаем регионы из BTS данных
    setRegions(BTS_REGIONS)
  }, [])

  const handleSelectPoint = (region: BtsRegion, point: BtsPoint) => {
    setSelectedPoint({
      id: point.id,
      name: point.name,
      address: point.address,
      regionId: region.id,
      regionName: locale === "ru" ? region.nameRu : region.name,
    })
    setIsOpen(false)
  }

  const displayText = selectedPoint
    ? `${selectedPoint.regionName}, ${selectedPoint.name}`
    : t("pickup_point") || "Пункт выдачи"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 hover:text-red-600 transition-colors max-w-[140px] truncate"
        title={displayText}
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
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[98]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-[320px] max-h-[400px] overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-[99]">
            <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-sm font-semibold text-gray-900">
                {t("select_pickup_point") || "Выберите пункт выдачи"}
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {regions.map((region) => (
                <div key={region.id} className="p-2">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                    {locale === "ru" ? region.nameRu : region.name}
                  </div>
                  {region.points.map((point) => (
                    <button
                      key={point.id}
                      onClick={() => handleSelectPoint(region, point)}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 transition-colors ${
                        selectedPoint?.id === point.id
                          ? "bg-red-50 text-red-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      <div className="font-medium">{point.name}</div>
                      <div className="text-xs text-gray-500">{point.address}</div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
