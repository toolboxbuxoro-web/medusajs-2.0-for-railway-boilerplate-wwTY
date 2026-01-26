"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePickupPoint } from "@lib/context/pickup-point-context"
import { BtsRegion, BtsPoint } from "@lib/data/bts"

export default function PickupPointsPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations("nav")
  const tCommon = useTranslations("common")
  const { selectedPoint, setSelectedPoint } = usePickupPoint()
  const [searchQuery, setSearchQuery] = useState("")
  const [regions, setRegions] = useState<BtsRegion[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // Flatten all points with their regions
  const allPoints = useMemo(() => {
    return regions.flatMap((region) =>
      region.points.map((point) => ({
        ...point,
        region: region,
      }))
    )
  }, [regions])

  // Filter points based on search query
  const filteredPoints = useMemo(() => {
    if (!searchQuery.trim()) {
      return allPoints
    }

    const query = searchQuery.toLowerCase().trim()
    return allPoints.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.address.toLowerCase().includes(query) ||
        (locale === "ru" ? item.region.nameRu : item.region.name)
          .toLowerCase()
          .includes(query)
    )
  }, [allPoints, searchQuery, locale])

  const handleSelectPoint = (region: BtsRegion, point: BtsPoint) => {
    setSelectedPoint({
      id: point.id,
      name: point.name,
      address: point.address,
      regionId: region.id,
      regionName: locale === "ru" ? region.nameRu : region.name,
    })
    router.back()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
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
          <h1 className="text-lg font-semibold text-gray-900">
            {t("select_pickup_point") || "Выберите пункт выдачи"}
          </h1>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("find_pickup_point") || "Найти пункт выдачи"}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Points List */}
      <div className="pb-4">
        {isLoading ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 text-sm">
              {tCommon("loading") || "Загрузка..."}
            </p>
          </div>
        ) : filteredPoints.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? t("no_points_found") || "Пункты выдачи не найдены"
                : t("no_points_available") || "Нет доступных пунктов выдачи"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPoints.map((item) => {
              const isSelected = selectedPoint?.id === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectPoint(item.region, item)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isSelected ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {item.name}
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
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.address}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {locale === "ru" ? item.region.nameRu : item.region.name}
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
        )}
      </div>
    </div>
  )
}
