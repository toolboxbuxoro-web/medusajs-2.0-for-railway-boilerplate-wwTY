"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface FavoritesContextType {
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favorites")
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites))
      } catch (e) {
        console.error("Failed to parse favorites from localStorage", e)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("favorites", JSON.stringify(favorites))
    }
  }, [favorites, isLoaded])

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id))
    } else {
      setFavorites([...favorites, id])
    }
  }

  const isFavorite = (id: string) => favorites.includes(id)

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
