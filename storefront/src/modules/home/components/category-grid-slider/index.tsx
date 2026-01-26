"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { getLocalizedField } from "@lib/util/localization"

type CategoryType = HttpTypes.StoreProductCategory & {
  metadata?: {
    image_url?: string
    [key: string]: unknown
  }
}

interface CategoryGridSliderProps {
  categories: CategoryType[]
  locale: string
}

const categoryIcons: Record<string, string> = {
  'tools': '🔧',
  'power-tools': '⚡',
  'hand-tools': '🔨',
  'garden': '🌱',
  'construction': '🏗️',
  'electrical': '💡',
  'plumbing': '🔩',
  'paint': '🎨',
  'default': '📦',
}

export default function CategoryGridSlider({ categories, locale }: CategoryGridSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Определяем мобильную версию
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const checkScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }, [])

  const scroll = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return
    
    if (isMobile) {
      // На мобильной версии прокручиваем по 1 карточке
      const cardWidth = container.clientWidth * 0.9 // 90% ширины экрана
      const gap = 12 // gap-3 = 12px
      const scrollAmount = cardWidth + gap
      
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    } else {
      // На ПК прокручиваем по 2 колонки (ширина одной карточки + gap)
      // Вычисляем ширину одной карточки: (clientWidth - gap) / 2
      const gap = 16 // gap-4 = 16px
      const cardWidth = (container.clientWidth - gap) / 2
      const scrollAmount = cardWidth + gap // ширина одной колонки (карточка + gap)
      
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }, [isMobile])

  // Проверка возможности прокрутки при загрузке и изменении размера
  useEffect(() => {
    checkScrollButtons()
    
    const container = scrollContainerRef.current
    if (!container) return

    container.addEventListener('scroll', checkScrollButtons)
    window.addEventListener('resize', checkScrollButtons)
    
    return () => {
      container.removeEventListener('scroll', checkScrollButtons)
      window.removeEventListener('resize', checkScrollButtons)
    }
  }, [checkScrollButtons, categories.length])

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className="bg-white py-6 sm:py-8">
      <div className="content-container relative">
        {/* Desktop: Grid with arrows */}
        <div className="hidden sm:block relative">
          {/* Navigation Arrows - Desktop only */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all duration-200"
              aria-label="Предыдущие категории"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all duration-200"
              aria-label="Следующие категории"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Scrollable Grid Container - ограниченная высота для показа 4 рядов (8 карточек) */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-hidden scroll-smooth pb-2 no-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              maxHeight: 'calc((200px + 1rem) * 4)', // 4 ряда карточек по 200px + gap
            }}
            onScroll={checkScrollButtons}
          >
            {/* Grid wrapper - 2 columns */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-max">
              {categories.map((category) => {
                const categoryName = getLocalizedField(category, "name", locale) || category.name
                const imageUrl = category.metadata?.image_url as string | undefined

                return (
                  <LocalizedClientLink
                    key={category.id}
                    href={`/categories/${category.handle}`}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex flex-col h-[200px]"
                  >
                    {/* Category Name - Top */}
                    <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-100 flex-shrink-0">
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {categoryName}
                      </h3>
                    </div>

                    {/* Category Image - Bottom, 1:1 aspect ratio */}
                    <div className="relative w-full flex-1 bg-gray-50 overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={categoryName}
                          fill
                          sizes="(max-width: 640px) 150px, 200px"
                          className="object-cover rounded-b-xl"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl sm:text-4xl">
                            {categoryIcons[category.handle || ''] || categoryIcons.default}
                          </span>
                        </div>
                      )}
                    </div>
                  </LocalizedClientLink>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile: Single column with swipe (no arrows) */}
        <div className="sm:hidden -mx-4 px-4">
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scroll-smooth pb-2 no-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
            }}
            onScroll={checkScrollButtons}
          >
            {categories.map((category, index) => {
              const categoryName = getLocalizedField(category, "name", locale) || category.name
              const imageUrl = category.metadata?.image_url as string | undefined

              return (
                <LocalizedClientLink
                  key={category.id}
                  href={`/categories/${category.handle}`}
                  className="flex-shrink-0 w-[90%] group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex flex-col"
                  style={{
                    scrollSnapAlign: "start",
                  }}
                >
                  {/* Category Name - Top */}
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {categoryName}
                    </h3>
                  </div>

                  {/* Category Image - Bottom, 1:1 aspect ratio */}
                  <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={categoryName}
                        fill
                        sizes="90vw"
                        className="object-cover rounded-b-xl"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">
                          {categoryIcons[category.handle || ''] || categoryIcons.default}
                        </span>
                      </div>
                    )}
                  </div>
                </LocalizedClientLink>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
