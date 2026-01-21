"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductPreviewContent from "@modules/products/components/product-preview/content"

interface SearchProductsSliderProps {
  products: HttpTypes.StoreProduct[]
}

export default function SearchProductsSlider({ products }: SearchProductsSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  
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
    
    const scrollAmount = container.clientWidth * 0.8
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    })
  }, [])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
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
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (isTouchOnInteractive.current || !hasMoved.current) {
      isTouchOnInteractive.current = false
      hasMoved.current = false
      return
    }
    
    const diffX = touchStartX.current - touchEndX.current
    const diffY = Math.abs(touchStartY.current - touchEndY.current)
    const threshold = 50
    
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

      {/* Left Arrow - Mobile/Tablet only */}
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

      {/* Right Arrow - Mobile/Tablet only */}
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
