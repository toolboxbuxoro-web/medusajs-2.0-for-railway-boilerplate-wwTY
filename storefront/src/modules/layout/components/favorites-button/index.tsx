"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Heart from "@modules/common/icons/heart"
import { useFavorites } from "@lib/context/favorites-context"
import { useEffect, useState } from "react"

export default function FavoritesButton({ label }: { label?: string }) {
  const { favorites } = useFavorites()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <LocalizedClientLink
        href="/favorites"
        className="p-1.5 sm:p-2 hover:text-red-600 transition-colors relative flex items-center justify-center sm:flex-col sm:gap-1"
        title={label || "Favorites"}
      >
        <Heart size="22" />
        {label && <span className="text-[10px] font-medium hidden sm:block">{label}</span>}
      </LocalizedClientLink>
    )
  }

  const count = favorites.length

  return (
    <LocalizedClientLink
      href="/favorites"
      className="p-1.5 sm:p-2 hover:text-red-600 transition-colors relative flex items-center justify-center sm:flex-col sm:gap-1"
      title={label || "Favorites"}
    >
      <Heart size="22" />
      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 sm:right-2 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white">
          {count}
        </span>
      )}
      {label && <span className="text-[10px] font-medium hidden sm:block">{label}</span>}
    </LocalizedClientLink>
  )
}
