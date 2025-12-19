"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Heart from "@modules/common/icons/heart"
import { useFavorites } from "@lib/context/favorites-context"
import { useEffect, useState } from "react"

export default function FavoritesButton() {
  const { favorites } = useFavorites()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <LocalizedClientLink
        href="/favorites"
        className="p-1.5 sm:p-2 hover:text-red-600 transition-colors relative flex items-center justify-center"
        title="Favorites"
      >
        <Heart size="22" />
      </LocalizedClientLink>
    )
  }

  const count = favorites.length

  return (
    <LocalizedClientLink
      href="/favorites"
      className="p-1.5 sm:p-2 hover:text-red-600 transition-colors relative flex items-center justify-center"
      title="Favorites"
    >
      <Heart size="22" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold border-2 border-white">
          {count}
        </span>
      )}
    </LocalizedClientLink>
  )
}
