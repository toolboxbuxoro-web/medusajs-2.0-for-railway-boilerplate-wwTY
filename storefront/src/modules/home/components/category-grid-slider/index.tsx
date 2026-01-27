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
  } | null
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
  const desktopScrollRef = useRef<HTMLDivElement>(null)
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [visibleCardsCount, setVisibleCardsCount] = useState(0)

  // Вычисляем количество видимых карточек на ПК для автоматического распределения gap
  useEffect(() => {
    if (isMobile) {
      setVisibleCardsCount(0)
      return
    }
    
    const calculateVisibleCards = () => {
      const container = desktopScrollRef.current
      if (!container) return
      
      const containerWidth = container.clientWidth
      const cardWidth = 160 // w-40 = 160px
      const minGap = 12 // gap-3 = 12px
      const paddingRight = 16 // pr-4 = 16px
      
      // Вычисляем сколько карточек помещается с минимальным gap
      const availableWidth = containerWidth - paddingRight
      const maxCards = Math.floor((availableWidth + minGap) / (cardWidth + minGap))
      
      setVisibleCardsCount(maxCards)
    }
    
    // Задержка для того, чтобы контейнер успел отрендериться
    const timeoutId = setTimeout(calculateVisibleCards, 100)
    window.addEventListener('resize', calculateVisibleCards)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', calculateVisibleCards)
    }
  }, [isMobile, categories.length])

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
    const container = desktopScrollRef.current
    if (!container) return
    
    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }, [])

  const scroll = useCallback((direction: "left" | "right") => {
    const container = desktopScrollRef.current
    if (!container) return
    
    // На ПК прокручиваем по несколько маленьких карточек
    const cardWidth = 160 // фиксированная ширина карточки на ПК
    const gap = 12 // gap-3 = 12px
    const scrollAmount = (cardWidth + gap) * 3 // прокручиваем по 3 карточки
    
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    })
  }, [])

  // Проверка возможности прокрутки при загрузке и изменении размера (только для десктопа)
  useEffect(() => {
    if (isMobile) return
    
    checkScrollButtons()
    
    const container = desktopScrollRef.current
    if (!container) return

    container.addEventListener('scroll', checkScrollButtons)
    window.addEventListener('resize', checkScrollButtons)
    
    return () => {
      container.removeEventListener('scroll', checkScrollButtons)
      window.removeEventListener('resize', checkScrollButtons)
    }
  }, [checkScrollButtons, categories.length, isMobile])

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className="bg-white pt-4 pb-1 sm:pt-6 sm:pb-2">
      <div className="content-container relative">
        {/* Desktop: Horizontal scroll with small cards in one row */}
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

          {/* Horizontal Scroll Container - один ряд маленьких карточек с адаптивным gap */}
          <div
            ref={desktopScrollRef}
            className={`flex overflow-x-auto scroll-smooth pb-2 pr-4 no-scrollbar ${
              visibleCardsCount > 0 && categories.length <= visibleCardsCount 
                ? 'justify-between' 
                : 'gap-3'
            }`}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
            onScroll={checkScrollButtons}
          >
            {categories.map((category) => {
              const categoryName = getLocalizedField(category, "name", locale) || category.name
              const imageUrl = category.metadata?.image_url as string | undefined

              return (
                <LocalizedClientLink
                  key={category.id}
                  href={`/categories/${category.handle}`}
                  className="flex-shrink-0 w-40 group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex flex-col"
                >
                  {/* Category Image - Top, 1:1 aspect ratio */}
                  <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={categoryName}
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">
                          {categoryIcons[category.handle || ''] || categoryIcons.default}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category Name - Bottom */}
                  <div className="px-2 py-2 border-t border-gray-100">
                    <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 text-center group-hover:text-red-600 transition-colors">
                      {categoryName}
                    </h3>
                  </div>
                </LocalizedClientLink>
              )
            })}
          </div>
        </div>

        {/* Mobile: Horizontal scroll slider with 3 columns (6 cards visible: 2 rows × 3 cols) */}
        <div className="sm:hidden -mx-4 px-4">
          <div
            ref={mobileScrollRef}
            className="flex gap-2 overflow-x-auto scroll-smooth pb-2 no-scrollbar"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
            }}
          >
            {/* Group categories into chunks of 6 (2 rows × 3 cols) */}
            {Array.from({ length: Math.ceil(categories.length / 6) }).map((_, groupIndex) => {
              const groupCategories = categories.slice(groupIndex * 6, (groupIndex + 1) * 6)
              const isFullGroup = groupCategories.length === 6
              
              return (
                <div
                  key={groupIndex}
                  className={`grid grid-cols-3 gap-2 flex-shrink-0 ${isFullGroup ? 'grid-rows-2' : 'grid-rows-1'}`}
                  style={{
                    width: 'calc(100vw - 2rem)',
                    scrollSnapAlign: "start",
                  }}
                >
                  {groupCategories.map((category) => {
                    const categoryName = getLocalizedField(category, "name", locale) || category.name
                    const imageUrl = category.metadata?.image_url as string | undefined

                    return (
                      <LocalizedClientLink
                        key={category.id}
                        href={`/categories/${category.handle}`}
                        className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col items-center p-2"
                      >
                        {/* Category Image - Compact, small square */}
                        <div className="relative w-full aspect-square bg-gray-50 overflow-hidden rounded-md mb-1.5">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={categoryName}
                              fill
                              sizes="33vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-lg">
                                {categoryIcons[category.handle || ''] || categoryIcons.default}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Category Name - Compact text below image */}
                        <h3 className="font-medium text-[10px] leading-tight text-gray-900 line-clamp-2 text-center group-hover:text-red-600 transition-colors">
                          {categoryName}
                        </h3>
                      </LocalizedClientLink>
                    )
                  })}
                  
                  {/* Fill empty slots if less than 6 categories in last group */}
                  {groupCategories.length < 6 && Array.from({ length: 6 - groupCategories.length }).map((_, emptyIndex) => (
                    <div key={`empty-${emptyIndex}`} className="opacity-0 pointer-events-none" />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
