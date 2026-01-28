"use client"

import { useState, FormEvent, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Search from "@modules/common/icons/search"
import { useCitySearch } from "@lib/context/city-search-context"

type SearchInputProps = {
  placeholder: string
  variant?: "desktop" | "mobile" | "compact"
}

export default function SearchInput({ placeholder, variant = "desktop" }: SearchInputProps) {
  const [query, setQuery] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const { searchQuery, setSearchQuery } = useCitySearch()
  
  // Check if we're on pickup points page
  const isPickupPointsPage = pathname?.includes("/pickup-points")
  
  // Sync with context when on pickup points page
  useEffect(() => {
    if (isPickupPointsPage) {
      setQuery(searchQuery)
    } else {
      // Clear query when leaving pickup points page
      setQuery("")
    }
  }, [isPickupPointsPage, searchQuery])
  
  // Extract base path for localized navigation (e.g., /ru/uz)
  const pathParts = pathname.split('/')
  const basePath = pathParts.length >= 3 ? `/${pathParts[1]}/${pathParts[2]}` : ''

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isPickupPointsPage) {
      // On pickup points page, just update context (no navigation)
      setSearchQuery(query.trim())
    } else {
      // Normal product search
      if (query.trim()) {
        router.push(`${basePath}/search?q=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  const handleChange = (value: string) => {
    setQuery(value)
    // Update context immediately for pickup points page (live search)
    if (isPickupPointsPage) {
      setSearchQuery(value.trim())
    }
  }

  if (variant === "desktop") {
    return (
      <form onSubmit={handleSubmit} className="relative flex-1">
        <div className="flex w-full rounded-xl overflow-hidden border-2 border-red-500 bg-white shadow-sm hover:shadow-md hover:border-red-600 transition-all duration-300">
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 lg:h-11 px-4 border-none focus:outline-none focus:ring-0 text-sm lg:text-base bg-transparent"
          />
          <button
            type="submit"
            className="px-4 bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <Search size="20" />
          </button>
        </div>
      </form>
    )
  }

  if (variant === "mobile") {
    return (
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="flex w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-200 transition-all">
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 px-4 border-none focus:outline-none focus:ring-0 text-base bg-transparent"
          />
          <button
            type="submit"
            className="px-3 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Search size="18" />
          </button>
        </div>
      </form>
    )
  }

  // compact variant
  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 pr-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
      >
        <Search size="16" />
      </button>
    </form>
  )
}
