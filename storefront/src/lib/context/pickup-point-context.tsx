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

// Custom event name for same-tab synchronization
const PICKUP_POINT_CHANGED_EVENT = "pickup-point-changed"

export function PickupPointProvider({ children }: { children: ReactNode }) {
  const [selectedPoint, setSelectedPointState] = useState<PickupPoint | null>(null)

  // Load from localStorage on mount and listen for changes
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem("selected_pickup_point")
        if (saved) {
          const parsed = JSON.parse(saved)
          setSelectedPointState(parsed)
        } else {
          setSelectedPointState(null)
        }
      } catch (e) {
        console.error("Failed to load pickup point from localStorage", e)
        setSelectedPointState(null)
      }
    }

    // Load initially
    loadFromStorage()

    // Listen for storage changes (cross-tab synchronization)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "selected_pickup_point") {
        loadFromStorage()
      }
    }

    // Listen for custom events (same-tab synchronization)
    const handleCustomEvent = () => {
      loadFromStorage()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener(PICKUP_POINT_CHANGED_EVENT, handleCustomEvent)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener(PICKUP_POINT_CHANGED_EVENT, handleCustomEvent)
    }
  }, [])

  // Save to localStorage and notify other components
  const setSelectedPoint = (point: PickupPoint | null) => {
    setSelectedPointState(point)
    try {
      if (point) {
        localStorage.setItem("selected_pickup_point", JSON.stringify(point))
      } else {
        localStorage.removeItem("selected_pickup_point")
      }
      // Dispatch custom event for same-tab synchronization
      window.dispatchEvent(new CustomEvent(PICKUP_POINT_CHANGED_EVENT))
    } catch (e) {
      console.error("Failed to save pickup point to localStorage", e)
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
