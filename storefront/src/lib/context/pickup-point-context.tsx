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
const LAST_CART_ID_KEY = "last_cart_id"

export function PickupPointProvider({ 
  children,
  cartId,
  initialData 
}: { 
  children: ReactNode
  cartId?: string
  initialData?: any 
}) {
  const [selectedPoint, setSelectedPointState] = useState<PickupPoint | null>(null)
  
  // Initialize state
  useEffect(() => {
    // 1. Check for cart change first
    if (cartId) {
      const lastCartId = localStorage.getItem(LAST_CART_ID_KEY)
      if (lastCartId && lastCartId !== cartId) {
        console.log("[PickupContext] Cart changed, clearing selection")
        localStorage.removeItem("selected_pickup_point")
        localStorage.setItem(LAST_CART_ID_KEY, cartId)
        setSelectedPointState(null)
        // If we cleared, we should NOT try to load from storage or metadata for the OLD cart
        // But we MIGHT want to load from metadata for the NEW cart if it exists
      } else if (!lastCartId) {
        localStorage.setItem(LAST_CART_ID_KEY, cartId)
      }
    }

    const loadFromStorage = () => {
      try {
        const saved = localStorage.getItem("selected_pickup_point")
        if (saved) {
          console.log("[PickupContext] Loaded from localStorage")
          setSelectedPointState(JSON.parse(saved))
          return true
        }
      } catch (e) {
        console.error("Failed to load pickup point from localStorage", e)
      }
      return false
    }

    // 2. Load from storage (if verified/matches cart)
    const hasStorage = loadFromStorage()

    // 3. If no storage, try initial cart metadata
    if (!hasStorage && initialData?.region_id && initialData?.point_id) {
       console.log("[PickupContext] Initializing from cart metadata")
       const point: PickupPoint = {
        id: initialData.point_id,
        name: initialData.point,
        address: initialData.point_address || "",
        regionId: initialData.region_id,
        regionName: initialData.region,
      }
      setSelectedPointState(point)
      // Also save to storage for persistence
      localStorage.setItem("selected_pickup_point", JSON.stringify(point))
    }
    
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
  }, [cartId, initialData])

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
