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
        className="p-2 hover:text-red-600 transition-colors relative"
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
      className="p-2 hover:text-red-600 transition-colors relative"
      title="Favorites"
    >
      <Heart size="22" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </LocalizedClientLink>
  )
}
