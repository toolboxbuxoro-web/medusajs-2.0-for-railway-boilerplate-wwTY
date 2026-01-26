"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { MapPin, ChevronDown, XMark } from "@medusajs/icons"
import { usePickupPoint } from "@lib/context/pickup-point-context"

interface BtsRegion {
  id: string
  name: string
  nameRu?: string
  points?: BtsPoint[]
}

interface BtsPoint {
  id: string
  name: string
  address: string
}

export default function CitySelector() {
  const t = useTranslations('nav')
  const params = useParams()
  const locale = (params.locale as string) || "ru"
  const { selectedPoint: globalPickupPoint, setSelectedPoint: setGlobalPickupPoint } = usePickupPoint()
  const [isOpen, setIsOpen] = useState(false)
  const [regions, setRegions] = useState<BtsRegion[]>([])
  const [points, setPoints] = useState<BtsPoint[]>([])
  const [selectedRegion, setSelectedRegion] = useState<BtsRegion | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<BtsPoint | null>(null)
  
  // Load saved selection from global context first, then fallback to localStorage
  useEffect(() => {
    // Prioritize global context
    if (globalPickupPoint) {
      // Find region by regionId
      const region = regions.find(r => r.id === globalPickupPoint.regionId)
      if (region) {
        setSelectedRegion(region)
        const point = region.points?.find(p => p.id === globalPickupPoint.id)
        if (point) {
          setSelectedPoint(point)
        }
      }
    } else {
      // Fallback to localStorage (for backward compatibility)
      const savedRegion = localStorage.getItem('bts_selected_region')
      const savedPoint = localStorage.getItem('bts_selected_point')
      
      if (savedRegion) {
        try {
          const region = JSON.parse(savedRegion)
          setSelectedRegion(region)
        } catch (e) {}
      }
      if (savedPoint) {
        try {
          const point = JSON.parse(savedPoint)
          setSelectedPoint(point)
        } catch (e) {}
      }
    }
  }, [globalPickupPoint, regions])

  // Fetch BTS data (regions and points)
  useEffect(() => {
    const fetchBtsData = async () => {
      try {
        const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
        const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
        
        const res = await fetch(`${backendUrl}/store/bts`, {
          headers: {
            "x-publishable-api-key": publishableKey,
          },
        })
        
        if (res.ok) {
          const data = await res.json()
          // Backend returns { regions: [...], pricing: {...} }
          // Regions already contain points
          setRegions(data.regions || [])
        }
      } catch (e) {
        console.error('Failed to fetch BTS data:', e)
      }
    }
    fetchBtsData()
  }, [])

  // Update points when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setPoints([])
      return
    }
    // Find the full region object from the state which has the points
    const fullRegion = regions.find(r => r.id === selectedRegion.id)
    if (fullRegion && (fullRegion as any).points) {
       setPoints((fullRegion as any).points)
    } else {
       setPoints([])
    }
  }, [selectedRegion, regions])

  // When opening modal, ensure region is selected if there's a global pickup point
  useEffect(() => {
    if (isOpen && globalPickupPoint && regions.length > 0) {
      const region = regions.find(r => r.id === globalPickupPoint.regionId)
      if (region && !selectedRegion) {
        setSelectedRegion(region)
        const point = region.points?.find(p => p.id === globalPickupPoint.id)
        if (point) {
          setSelectedPoint(point)
        }
      }
    }
  }, [isOpen, globalPickupPoint, regions, selectedRegion])

  const handleRegionSelect = (region: BtsRegion) => {
    setSelectedRegion(region)
    setSelectedPoint(null)
    // Clear global context when region changes (point must be reselected)
    setGlobalPickupPoint(null)
    // Keep localStorage for backward compatibility
    localStorage.setItem('bts_selected_region', JSON.stringify(region))
    localStorage.removeItem('bts_selected_point')
  }

  const handlePointSelect = (point: BtsPoint) => {
    if (!selectedRegion) return
    
    setSelectedPoint(point)
    
    // Save to global context (this is what checkout uses)
    const pickupPointData = {
      id: point.id,
      name: point.name,
      address: point.address,
      regionId: selectedRegion.id,
      regionName: locale === "ru" ? (selectedRegion.nameRu || selectedRegion.name) : selectedRegion.name,
    }
    
    console.log("[CitySelector] Saving pickup point to context:", pickupPointData)
    setGlobalPickupPoint(pickupPointData)
    
    // Keep localStorage for backward compatibility (save full data structure)
    localStorage.setItem('bts_selected_point', JSON.stringify(point))
    localStorage.setItem('bts_selected_region', JSON.stringify(selectedRegion))
    
    setIsOpen(false)
  }

  // Use global context for display if available, otherwise use local state
  const displayPoint = globalPickupPoint || selectedPoint
  const displayRegion = displayPoint 
    ? regions.find(r => r.id === (globalPickupPoint?.regionId || selectedRegion?.id))
    : selectedRegion
    
  const displayText = displayPoint 
    ? displayPoint.name 
    : displayRegion 
      ? (displayRegion.nameRu || displayRegion.name)
      : t('select_city') || 'Выберите город'

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        <span className="max-w-[200px] truncate">{displayText}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[200]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-[201] max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {t('select_delivery_point') || 'Выберите пункт выдачи'}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XMark className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {/* Regions */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  {t('region') || 'Регион'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {regions.map((region) => {
                    // Check if this region is selected (either from global context or local state)
                    const isSelected = 
                      (globalPickupPoint && globalPickupPoint.regionId === region.id) ||
                      (selectedRegion && selectedRegion.id === region.id)
                    return (
                      <button
                        key={region.id}
                        onClick={() => handleRegionSelect(region)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {region.nameRu || region.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Points */}
              {(selectedRegion || (globalPickupPoint && regions.find(r => r.id === globalPickupPoint.regionId))) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    {t('pickup_point') || 'Пункт выдачи'}
                  </h3>
                  <div className="space-y-2">
                    {points.map((point) => {
                      const isSelected = globalPickupPoint?.id === point.id || selectedPoint?.id === point.id
                      return (
                        <button
                          key={point.id}
                          onClick={() => handlePointSelect(point)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-red-50 border-2 border-red-600'
                              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          <div className="font-medium text-gray-900">{point.name}</div>
                          <div className="text-sm text-gray-500">{point.address}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
