"use client"

import { useState } from "react"
import { Button } from "@medusajs/ui"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import Heart from "@modules/common/icons/heart"
import Spinner from "@modules/common/icons/spinner"
import { useParams, useRouter } from "next/navigation"

import { useFavorites } from "@lib/context/favorites-context"
import { useTranslations } from "next-intl"

export default function ProductPreviewOverlay({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const [isAdding, setIsAdding] = useState(false)
  const { toggleFavorite, isFavorite } = useFavorites()
  const params = useParams()
  const countryCode = params.countryCode as string
  const router = useRouter()
  const t = useTranslations("product")

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (product.variants?.length === 1 && product.variants[0].id) {
      setIsAdding(true)
      try {
        await addToCart({
            variantId: product.variants[0].id,
            quantity: 1,
            countryCode,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setIsAdding(false)
      }
    } else {
        router.push(`/${countryCode}/products/${product.handle}`)
    }
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(product.id)
  }

  const favorite = isFavorite(product.id)

  return (
    <div className="absolute bottom-4 left-0 right-0 px-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out z-10 translate-y-4 group-hover:translate-y-0">
      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg border-0"
      >
        {isAdding ? <Spinner /> : (product.variants?.length === 1 ? t("add_to_cart") : t("select"))}
      </Button>
      <button
        onClick={handleToggleFavorite}
        className={`w-8 h-8 flex items-center justify-center rounded-md shadow-lg transition-colors ${favorite ? 'bg-red-50 text-red-600' : 'bg-white text-gray-900 hover:text-red-600'}`}
      >
        <Heart fill={favorite ? "currentColor" : "none"} />
      </button>
    </div>
  )
}
