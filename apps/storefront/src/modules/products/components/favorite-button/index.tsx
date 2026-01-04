"use client"

import { useFavorites } from "@lib/context/favorites-context"
import Heart from "@modules/common/icons/heart"
import { useTranslations } from 'next-intl'

type FavoriteButtonProps = {
  productId: string
}

const FavoriteButton = ({ productId }: FavoriteButtonProps) => {
  const { toggleFavorite, isFavorite } = useFavorites()
  const t = useTranslations('product')
  const favorite = isFavorite(productId)

  return (
    <button
      onClick={() => toggleFavorite(productId)}
      className={`flex items-center gap-1.5 text-xs sm:text-sm transition-colors ${favorite ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
    >
      <Heart size="18" fill={favorite ? "currentColor" : "none"} />
      <span className="hidden sm:inline">{t('favorites')}</span>
    </button>
  )
}

export default FavoriteButton
