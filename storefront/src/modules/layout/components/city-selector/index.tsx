"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { MapPin, ChevronDown, XMark } from "@medusajs/icons"

interface BtsRegion {
  id: string
  name: string
  nameRu?: string
}

interface BtsPoint {
  id: string
  name: string
  address: string
}

export default function CitySelector() {
  const t = useTranslations('nav')
  const [isOpen, setIsOpen] = useState(false)
  const [regions, setRegions] = useState<BtsRegion[]>([])
  const [points, setPoints] = useState<BtsPoint[]>([])
  const [selectedRegion, setSelectedRegion] = useState<BtsRegion | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<BtsPoint | null>(null)
  
  // Load saved selection from localStorage
  useEffect(() => {
    const savedRegion = localStorage.getItem('bts_selected_region')
    const savedPoint = localStorage.getItem('bts_selected_point')
    
    if (savedRegion) {
      try {
        setSelectedRegion(JSON.parse(savedRegion))
      } catch (e) {}
    }
    if (savedPoint) {
      try {
        setSelectedPoint(JSON.parse(savedPoint))
      } catch (e) {}
    }
  }, [])

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

  const handleRegionSelect = (region: BtsRegion) => {
    setSelectedRegion(region)
    setSelectedPoint(null)
    localStorage.setItem('bts_selected_region', JSON.stringify(region))
    localStorage.removeItem('bts_selected_point')
  }

  const handlePointSelect = (point: BtsPoint) => {
    setSelectedPoint(point)
    localStorage.setItem('bts_selected_point', JSON.stringify(point))
    setIsOpen(false)
  }

  const displayText = selectedPoint 
    ? selectedPoint.name 
    : selectedRegion 
      ? (selectedRegion.nameRu || selectedRegion.name)
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
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => handleRegionSelect(region)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedRegion?.id === region.id
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {region.nameRu || region.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Points */}
              {selectedRegion && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    {t('pickup_point') || 'Пункт выдачи'}
                  </h3>
                  <div className="space-y-2">
                    {points.map((point) => (
                      <button
                        key={point.id}
                        onClick={() => handlePointSelect(point)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedPoint?.id === point.id
                            ? 'bg-red-50 border-2 border-red-600'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{point.name}</div>
                        <div className="text-sm text-gray-500">{point.address}</div>
                      </button>
                    ))}
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
