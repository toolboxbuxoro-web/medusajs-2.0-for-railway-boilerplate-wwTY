"use client"

import { useEffect, useRef, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductPreviewContent from "@modules/products/components/product-preview/content"

interface SearchProductsSliderProps {
  products: HttpTypes.StoreProduct[]
}

const AUTO_SCROLL_INTERVAL = 4000 // 4 seconds

export default function SearchProductsSlider({ products }: SearchProductsSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isUserScrollingRef = useRef(false)
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    if (products.length === 0) return

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
  }, [products.length, scrollToNext])

  // Handle user scroll - pause auto-scroll temporarily
  const handleUserScroll = useCallback(() => {
    isUserScrollingRef.current = true

    // Clear existing timeout
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current)
    }

    // Resume auto-scroll after user stops scrolling for 2 seconds
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false
    }, 2000)
  }, [])

  // Touch swipe handling
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const isTouchOnInteractive = useRef(false)
  const hasMoved = useRef(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
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
    if (isTouchOnInteractive.current) return
    
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
    
    const diffX = Math.abs(touchStartX.current - touchEndX.current)
    const diffY = Math.abs(touchStartY.current - touchEndY.current)
    
    if (diffX > 10 || diffY > 10) {
      hasMoved.current = true
      handleUserScroll()
    }
  }, [handleUserScroll])

  const handleTouchEnd = useCallback(() => {
    isTouchOnInteractive.current = false
    hasMoved.current = false
  }, [])

  if (products.length === 0) {
    return null
  }

  return (
    <div className="relative group">
      {/* Horizontal Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 sm:gap-4 lg:gap-5 overflow-x-auto scroll-smooth pb-2 no-scrollbar"
        style={{ 
          scrollbarWidth: "none", 
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch"
        }}
        onScroll={handleUserScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {products.map((product, index) => (
          <div 
            key={product.id} 
            className="flex-none w-[45%] sm:w-[30%] md:w-[23%] lg:w-[18%] xl:w-[15%]"
          >
            <ProductPreviewContent 
              product={product} 
              isFeatured={index < 8}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
