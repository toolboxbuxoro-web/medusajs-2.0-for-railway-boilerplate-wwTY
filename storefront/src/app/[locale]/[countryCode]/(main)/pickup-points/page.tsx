"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePickupPoint } from "@lib/context/pickup-point-context"
import { useCitySearch } from "@lib/context/city-search-context"
import { BtsRegion, BtsPoint } from "@lib/data/bts"

export default function PickupPointsPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("nav")
  const tCommon = useTranslations("common")
  const { selectedPoint, setSelectedPoint } = usePickupPoint()
  const { searchQuery, setSearchQuery, selectedRegionId, setSelectedRegionId } = useCitySearch()
  const [regions, setRegions] = useState<BtsRegion[]>([])
  const [selectedRegion, setSelectedRegion] = useState<BtsRegion | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Sync selectedRegion with context
  useEffect(() => {
    if (selectedRegion) {
      setSelectedRegionId(selectedRegion.id)
    } else {
      setSelectedRegionId(null)
    }
  }, [selectedRegion, setSelectedRegionId])

  // Clear search when component unmounts (user leaves page)
  useEffect(() => {
    return () => {
      setSearchQuery("")
      setSelectedRegionId(null)
    }
  }, [setSearchQuery, setSelectedRegionId])

  // Fetch BTS data from backend API (same as checkout)
  useEffect(() => {
    const fetchBtsData = async () => {
      setIsLoading(true)
      try {
        const backendUrl = (
          process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
        ).replace(/\/$/, "")
        const publishableKey =
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

        const response = await fetch(`${backendUrl}/store/bts`, {
          headers: {
            "x-publishable-api-key": publishableKey,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setRegions(data.regions || [])
        } else {
          throw new Error("Failed to fetch BTS data")
        }
      } catch (err) {
        console.error("Failed to fetch BTS data:", err)
        // Fallback: use local import if backend fetch fails
        try {
          const mod = await import("@lib/data/bts")
          setRegions(mod.BTS_REGIONS)
        } catch (importErr) {
          console.error("Failed to load fallback BTS data:", importErr)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchBtsData()
  }, [])

  // Filter regions based on search query (when no region selected)
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) {
      return regions
    }

    const query = searchQuery.toLowerCase().trim()
    return regions.filter(
      (region) =>
        (locale === "ru" ? region.nameRu : region.name)
          .toLowerCase()
          .includes(query)
    )
  }, [regions, searchQuery, locale])

  // Filter points based on search query (when region selected)
  const filteredPoints = useMemo(() => {
    if (!selectedRegion) return []

    const points = selectedRegion.points || []
    if (!searchQuery.trim()) {
      return points
    }

    const query = searchQuery.toLowerCase().trim()
    return points.filter(
      (point) =>
        point.name.toLowerCase().includes(query) ||
        point.address.toLowerCase().includes(query)
    )
  }, [selectedRegion, searchQuery])

  const handleSelectRegion = (region: BtsRegion) => {
    setSelectedRegion(region)
    setSearchQuery("") // Clear search when selecting region
  }

  const handleBackToRegions = () => {
    setSelectedRegion(null)
    setSearchQuery("") // Clear search when going back
  }

  const handleSelectPoint = (region: BtsRegion, point: BtsPoint) => {
    const pickupPointData = {
      id: point.id,
      name: point.name,
      address: point.address,
      regionId: region.id,
      regionName: locale === "ru" ? region.nameRu : region.name,
    }
    
    console.log("[PickupPointsPage] Saving pickup point:", pickupPointData)
    setSelectedPoint(pickupPointData)
    setSearchQuery("") // Clear search when selecting point
    
    // Small delay to ensure context is updated before navigation
    setTimeout(() => {
      router.back()
    }, 100)
  }

  const currentTitle = selectedRegion
    ? locale === "ru"
      ? selectedRegion.nameRu
      : selectedRegion.name
    : t("select_pickup_point") || "Выберите пункт выдачи"

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-center h-14 px-4">
          <button
            onClick={() => {
              if (selectedRegion) {
                handleBackToRegions()
              } else {
                router.back()
              }
            }}
            className="absolute left-4 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Назад"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 text-center">
            {currentTitle}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="pb-4 max-w-2xl mx-auto">
        {isLoading ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm sm:text-base text-gray-500">
              {tCommon("loading") || "Загрузка..."}
            </p>
          </div>
        ) : selectedRegion ? (
          // Show points for selected region
          filteredPoints.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm sm:text-base text-gray-500">
                {searchQuery
                  ? t("no_points_found") || "Пункты выдачи не найдены"
                  : t("no_points_available") || "Нет доступных пунктов выдачи"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPoints.map((point) => {
                const isSelected = selectedPoint?.id === point.id
                return (
                  <button
                    key={point.id}
                    onClick={() => handleSelectPoint(selectedRegion, point)}
                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-red-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm sm:text-base font-medium ${
                              isSelected ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {point.name}
                          </span>
                          {isSelected && (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-red-600 flex-shrink-0"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                          {point.address}
                        </div>
                      </div>
                      {!isSelected && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-gray-400 flex-shrink-0 ml-2"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        ) : (
          // Show regions list
          filteredRegions.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm sm:text-base text-gray-500">
                {searchQuery
                  ? t("no_points_found") || "Регионы не найдены"
                  : t("no_points_available") || "Нет доступных регионов"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRegions.map((region) => {
                const pointCount = region.points?.length || 0
                return (
                  <button
                    key={region.id}
                    onClick={() => handleSelectRegion(region)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm sm:text-base font-medium text-gray-900">
                          {locale === "ru" ? region.nameRu : region.name}
                        </span>
                        {pointCount > 0 && (
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">
                            {pointCount}{" "}
                            {pointCount === 1
                              ? "пункт"
                              : pointCount < 5
                              ? "пункта"
                              : "пунктов"}
                          </div>
                        )}
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400 flex-shrink-0 ml-2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
