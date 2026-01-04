"use client"

import { useFavorites } from "@lib/context/favorites-context"
import { HttpTypes } from "@medusajs/types"
import ProductPreviewContent from "@modules/products/components/product-preview/content"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { getFavoriteProducts } from "../actions"

export default function FavoritesTemplate({
  countryCode,
}: {
  countryCode: string
}) {
  const { favorites } = useFavorites()
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations("store")

  useEffect(() => {
    const fetchProducts = async () => {
      if (favorites.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      try {
        const fetchedProducts = await getFavoriteProducts(favorites, countryCode)
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Failed to fetch favorite products", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [favorites, countryCode])

  if (loading) {
    return (
      <div className="content-container py-6">
        <div className="mb-8">
          <h1 className="text-2xl-semi">{t("favorites")}</h1>
        </div>
        <SkeletonProductGrid />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="content-container py-6 min-h-[50vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl-semi mb-4">{t("favorites")}</h1>
        <p className="text-base-regular text-gray-700">
          {t("no_favorites")}
        </p>
      </div>
    )
  }

  return (
    <div className="content-container py-6">
      <div className="mb-8">
        <h1 className="text-2xl-semi">{t("favorites")}</h1>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((p) => (
          <li key={p.id}>
            <ProductPreviewContent product={p} isFeatured={false} />
          </li>
        ))}
      </ul>
    </div>
  )
}
