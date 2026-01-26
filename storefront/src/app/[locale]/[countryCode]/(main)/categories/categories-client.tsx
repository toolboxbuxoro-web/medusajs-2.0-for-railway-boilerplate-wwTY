"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { getLocalizedField } from "@lib/util/localization"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type CategoriesPageProps = {
  categories: HttpTypes.StoreProductCategory[]
  locale: string
}

const CategoryItem = ({
  category,
  locale,
}: {
  category: HttpTypes.StoreProductCategory
  locale: string
}) => {
  const name = getLocalizedField(category, "name", locale) || category.name
  const imageUrl = category.metadata?.image_url as string | undefined
  const iconUrl = category.metadata?.icon_url as string | undefined

  // Иконки по умолчанию для категорий
  const getCategoryIcon = (handle: string) => {
    const iconMap: Record<string, string> = {
      "instrumenty": "🔧",
      "elektrika": "💡",
      "santehnika": "🚿",
      "stroymaterialy": "🧱",
      "sad-ogorod": "🌿",
      "avto": "🚗",
      "bytovaya-tehnika": "🏠",
      "krepezh": "🔩",
      "otdelochnye": "🎨",
      "ofis": "📋",
      "sklad": "📦",
      "stanki": "⚙️",
      "klimat": "❄️",
    }
    return iconMap[handle] || "📦"
  }

  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      className="flex items-center gap-3 p-3 border-b border-gray-200 hover:bg-gray-50 transition-colors group"
    >
      {/* Иконка категории */}
      <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
        {iconUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={iconUrl}
              alt=""
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
        ) : imageUrl ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        ) : (
          <span className="text-2xl text-red-600">
            {getCategoryIcon(category.handle || "")}
          </span>
        )}
      </div>

      {/* Название категории */}
      <span className="flex-1 font-medium text-gray-900 text-sm">
        {name}
      </span>

      {/* Стрелка вправо */}
      <svg
        className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </LocalizedClientLink>
  )
}

export default function CategoriesPageClient({ categories, locale }: CategoriesPageProps) {
  const router = useRouter()
  const t = useTranslations("nav")

  return (
    <div className="bg-white min-h-screen">
      {/* Заголовок - без поиска, только навигация */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Кнопка назад */}
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Заголовок */}
          <h1 className="text-lg font-bold text-gray-900">{t("catalog")}</h1>

          {/* Кнопка закрытия */}
          <button
            onClick={() => router.push("/")}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Список категорий */}
      <div className="bg-white">
        {categories.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {categories.map((category: HttpTypes.StoreProductCategory) => (
              <CategoryItem key={category.id} category={category} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>{t("no_categories") || "Категории не найдены"}</p>
          </div>
        )}
      </div>
    </div>
  )
}
