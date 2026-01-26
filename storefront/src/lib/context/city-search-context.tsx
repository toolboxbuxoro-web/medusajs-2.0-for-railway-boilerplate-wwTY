"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface CitySearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedRegionId: string | null
  setSelectedRegionId: (id: string | null) => void
}

const CitySearchContext = createContext<CitySearchContextType | undefined>(undefined)

export function CitySearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)

  return (
    <CitySearchContext.Provider value={{ searchQuery, setSearchQuery, selectedRegionId, setSelectedRegionId }}>
      {children}
    </CitySearchContext.Provider>
  )
}

export function useCitySearch() {
  const context = useContext(CitySearchContext)
  if (context === undefined) {
    throw new Error("useCitySearch must be used within a CitySearchProvider")
  }
  return context
}
