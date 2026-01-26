"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductPreviewContent from "@modules/products/components/product-preview/content"

const MAX_PRODUCTS = 20
const AUTO_SCROLL_INTERVAL = 6000 // 6 seconds

interface ProductSliderProps {
  products: HttpTypes.StoreProduct[]
  totalCount: number
  collectionId?: string
}

export default function ProductSlider({ products, totalCount, collectionId }: ProductSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isUserScrollingRef = useRef(false)
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Limit to max 20 products
  const displayProducts = products.slice(0, MAX_PRODUCTS)
  
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
    
    // Update external buttons if collectionId is provided
    if (collectionId) {
      const prevBtn = document.querySelector(`[data-slider-prev="${collectionId}"]`) as HTMLButtonElement
      const nextBtn = document.querySelector(`[data-slider-next="${collectionId}"]`) as HTMLButtonElement
      
      if (prevBtn) {
        prevBtn.disabled = scrollLeft <= 5
        prevBtn.style.opacity = scrollLeft <= 5 ? "0.3" : "1"
      }
      if (nextBtn) {
        nextBtn.disabled = scrollLeft >= scrollWidth - clientWidth - 5
        nextBtn.style.opacity = scrollLeft >= scrollWidth - clientWidth - 5 ? "0.3" : "1"
      }
    }
  }, [collectionId])

  const scroll = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return
    
    // На мобильной версии прокручиваем по 2 карточки
    const isMobile = window.innerWidth < 640 // sm breakpoint
    if (isMobile) {
      // Ширина 2 карточек на мобильной: 45% + gap + 45% ≈ 90% + gap
      // Конвертируем в пиксели
      const cardWidth = container.clientWidth * 0.45
      const gap = 12 // gap-3 = 12px
      const twoCardsWidth = cardWidth * 2 + gap
      
      container.scrollBy({
        left: direction === "left" ? -twoCardsWidth : twoCardsWidth,
        behavior: "smooth"
      })
    } else {
      // На десктопе прокручиваем по 4 карточки
      const scrollAmount = container.clientWidth * 0.8
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }, [])

  const scrollToNext = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || isUserScrollingRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    const maxScroll = scrollWidth - clientWidth

    // If at the end, scroll back to start
    if (scrollLeft >= maxScroll - 10) {
      container.scrollTo({
        left: 0,
        behavior: "smooth"
      })
    } else {
      // Scroll by approximately 4 cards width
      const scrollAmount = container.clientWidth * 0.8
      container.scrollBy({
        left: scrollAmount,
        behavior: "smooth"
      })
    }
  }, [])

  // Auto-scroll effect
  useEffect(() => {
    if (displayProducts.length === 0) return

    // Clear any existing interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
    }

    // Start auto-scroll
    autoScrollIntervalRef.current = setInterval(() => {
      scrollToNext()
    }, AUTO_SCROLL_INTERVAL)

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [displayProducts.length, scrollToNext])

  const handleScrollEnd = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const { scrollLeft, scrollWidth, clientWidth } = container
    const distanceToEnd = scrollWidth - scrollLeft - clientWidth
    
    // На мобильной версии: если осталось меньше 2 карточек до конца, прокрутить до конца
    const isMobile = window.innerWidth < 640
    if (isMobile && distanceToEnd > 0 && distanceToEnd < clientWidth * 0.5) {
      container.scrollTo({
        left: scrollWidth - clientWidth,
        behavior: "smooth"
      })
    }
    
    checkScrollButtons()
  }, [checkScrollButtons])

  // Connect external buttons if collectionId is provided
  useEffect(() => {
    if (!collectionId) return
    
    const prevBtn = document.querySelector(`[data-slider-prev="${collectionId}"]`) as HTMLButtonElement
    const nextBtn = document.querySelector(`[data-slider-next="${collectionId}"]`) as HTMLButtonElement
    
    const handlePrev = () => scroll("left")
    const handleNext = () => scroll("right")
    
    if (prevBtn) {
      prevBtn.addEventListener("click", handlePrev)
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", handleNext)
    }
    
    return () => {
      if (prevBtn) {
        prevBtn.removeEventListener("click", handlePrev)
      }
      if (nextBtn) {
        nextBtn.removeEventListener("click", handleNext)
      }
    }
  }, [collectionId, scroll])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    // Initial check
    setTimeout(checkScrollButtons, 100)
    
    container.addEventListener("scroll", checkScrollButtons)
    window.addEventListener("resize", checkScrollButtons)
    
    return () => {
      container.removeEventListener("scroll", checkScrollButtons)
      window.removeEventListener("resize", checkScrollButtons)
    }
  }, [checkScrollButtons])

  // Touch swipe handling
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const isTouchOnInteractive = useRef(false)
  const hasMoved = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Check if touch started on an interactive element (button, link, etc.)
    const target = e.target as HTMLElement
    const interactiveElement = target.closest('button, a, [role="button"], [data-interactive]')
    isTouchOnInteractive.current = !!interactiveElement
    
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
    hasMoved.current = false
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Skip if touch started on interactive element
    if (isTouchOnInteractive.current) return
    
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
    
    // Check if finger has moved significantly (more than 10px)
    const diffX = Math.abs(touchStartX.current - touchEndX.current)
    const diffY = Math.abs(touchStartY.current - touchEndY.current)
    
    if (diffX > 10 || diffY > 10) {
      hasMoved.current = true
      handleUserScroll()
    }
  }, [handleUserScroll])

  const handleTouchEnd = useCallback(() => {
    // Skip swipe if touch started on interactive element or didn't move
    if (isTouchOnInteractive.current || !hasMoved.current) {
      isTouchOnInteractive.current = false
      hasMoved.current = false
      return
    }
    
    const diffX = touchStartX.current - touchEndX.current
    const diffY = Math.abs(touchStartY.current - touchEndY.current)
    const threshold = 50 // minimum swipe distance
    
    // Only trigger horizontal swipe if horizontal movement > vertical movement
    // This prevents swipe on vertical scrolling gestures
    if (Math.abs(diffX) > threshold && Math.abs(diffX) > diffY) {
      if (diffX > 0 && canScrollRight) {
        scroll("right")
      } else if (diffX < 0 && canScrollLeft) {
        scroll("left")
      }
    }
    
    isTouchOnInteractive.current = false
    hasMoved.current = false
  }, [canScrollLeft, canScrollRight, scroll])

  if (displayProducts.length === 0) {
    return null
  }

  return (
    <div className="relative group">
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto scroll-smooth pb-2 no-scrollbar"
        style={{ 
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: isMobile ? "x mandatory" : "none"
        }}
        onScroll={handleUserScroll}
        onScrollEnd={handleScrollEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {displayProducts.map((product, index) => {
          const isLastCard = index === displayProducts.length - 1
          const isOddCount = displayProducts.length % 2 !== 0
          
          // На мобильной версии веб-сайта: snap только на четных индексах (каждая пара начинается с четного)
          // Если нечетное количество и это последняя карточка, тоже делаем snap
          const shouldSnap = isMobile && (index % 2 === 0 || (isLastCard && isOddCount))
          
          return (
            <div 
              key={product.id} 
              className="flex-none w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18%] xl:w-[15%]"
              style={{
                scrollSnapAlign: shouldSnap ? "start" : undefined
              }}
            >
              <ProductPreviewContent product={product} isFeatured />
            </div>
          )
        })}
      </div>

      {/* Left Arrow - Mobile/Tablet only (desktop uses header arrows) */}
      <button
        onClick={() => scroll("left")}
        className={`absolute left-0 top-1/2 z-10 w-8 h-8 sm:hidden rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center transition-all duration-200 ${
          canScrollLeft 
            ? "opacity-100" 
            : "opacity-0 pointer-events-none"
        }`}
        style={{ transform: "translate(-30%, -50%)" }}
        aria-label="Прокрутить влево"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Right Arrow - Mobile/Tablet only (desktop uses header arrows) */}
      <button
        onClick={() => scroll("right")}
        className={`absolute right-0 top-1/2 z-10 w-8 h-8 sm:hidden rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center transition-all duration-200 ${
          canScrollRight 
            ? "opacity-100" 
            : "opacity-0 pointer-events-none"
        }`}
        style={{ transform: "translate(30%, -50%)" }}
        aria-label="Прокрутить вправо"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
