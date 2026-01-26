"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface PickupPoint {
  id: string
  name: string
  address: string
  regionId: string
  regionName: string
}

interface PickupPointContextType {
  selectedPoint: PickupPoint | null
  setSelectedPoint: (point: PickupPoint | null) => void
}

const PickupPointContext = createContext<PickupPointContextType | undefined>(undefined)

export function PickupPointProvider({ children }: { children: ReactNode }) {
  const [selectedPoint, setSelectedPointState] = useState<PickupPoint | null>(null)

  // Загружаем из localStorage при монтировании
  useEffect(() => {
    const saved = localStorage.getItem("selected_pickup_point")
    if (saved) {
      try {
        setSelectedPointState(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load pickup point from localStorage", e)
      }
    }
  }, [])

  // Сохраняем в localStorage при изменении
  const setSelectedPoint = (point: PickupPoint | null) => {
    setSelectedPointState(point)
    if (point) {
      localStorage.setItem("selected_pickup_point", JSON.stringify(point))
    } else {
      localStorage.removeItem("selected_pickup_point")
    }
  }

  return (
    <PickupPointContext.Provider value={{ selectedPoint, setSelectedPoint }}>
      {children}
    </PickupPointContext.Provider>
  )
}

export function usePickupPoint() {
  const context = useContext(PickupPointContext)
  if (context === undefined) {
    throw new Error("usePickupPoint must be used within a PickupPointProvider")
  }
  return context
}
