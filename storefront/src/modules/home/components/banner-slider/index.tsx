"use client"

import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams } from "next/navigation"

import { useTranslations } from "next-intl"

import type { Banner } from "@lib/data/banners"

import { getLocalizedField } from "@lib/util/localization"

const AUTOPLAY_INTERVAL = 7000

type Slide = {
  id: string
  title: string
  subtitle: string
  description: string
  cta: string
  href: string
  image_url?: string
  hasContent: boolean
}

export default function BannerSlider({ slides: serverSlides }: { slides?: Banner[] }) {
  const [current, setCurrent] = useState(0)
  const { locale } = useParams()
  const t = useTranslations("home")
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)

  const slides: Slide[] = useMemo(() => {
    if (!serverSlides?.length) return []
    
    return serverSlides.map((b) => {
      const currentLocale = locale as string
      const title = getLocalizedField(b as any, "title", currentLocale) || ""
      const subtitle = getLocalizedField(b as any, "subtitle", currentLocale) || ""
      const description = getLocalizedField(b as any, "description", currentLocale) || ""
      const cta = getLocalizedField(b as any, "cta", currentLocale) || ""
      
      // Check if slide has any text content
      const hasContent = !!(title || subtitle || description || cta)
      
      return {
        id: b.id,
        title,
        subtitle,
        description,
        cta,
        href: b.href || "/",
        image_url: b.image_url,
        hasContent,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSlides, locale])
  
  const total = slides.length
  
  const goToSlide = useCallback((index: number) => {
    if (total === 0) return // Safety check
    if (index < 0) {
      setCurrent(total - 1)
    } else if (index >= total) {
      setCurrent(0)
    } else {
      setCurrent(index)
    }
  }, [total])

  const goNext = useCallback(() => goToSlide(current + 1), [current, goToSlide])
  const goPrev = useCallback(() => goToSlide(current - 1), [current, goToSlide])

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50 // minimum swipe distance
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goNext()
      } else {
        goPrev()
      }
    }
  }

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    e.preventDefault()
  }

  const handleMouseMove = () => {
    if (!isDragging.current) return
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    
    const diff = dragStartX.current - e.clientX
    const threshold = 50
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goNext()
      } else {
        goPrev()
      }
    }
  }

  const handleMouseLeave = () => {
    isDragging.current = false
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (total <= 1) return // Don't autoplay if 0 or 1 slide

    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total)
    }, AUTOPLAY_INTERVAL)

    return () => clearInterval(id)
  }, [total])

  // Don't render if no banners
  if (total === 0) return null

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl sm:shadow-2xl shadow-black/10 mb-4 sm:mb-6 lg:mb-10 cursor-grab active:cursor-grabbing select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3:1 aspect ratio container */}
      <div className="relative w-full" style={{ paddingBottom: "33.33%" }}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-500 ease-out ${
              index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Image container - always full coverage */}
            {slide.image_url && (
              <img
                src={slide.image_url}
                alt={slide.title || "Banner"}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            )}
            
            {/* Overlay and content - only if has text content */}
            {slide.hasContent && (
              <>
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-0" />
                
                <div className="content-container h-full flex items-center py-4 sm:py-6 lg:py-8">
                  <div className="max-w-full sm:max-w-xl lg:max-w-2xl text-white space-y-1 sm:space-y-2 lg:space-y-3 relative z-10 px-10 sm:px-16 lg:px-20">
                    {/* Subtitle badge */}
                    {slide.subtitle && (
                      <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[9px] sm:text-[10px] lg:text-xs font-semibold tracking-wide uppercase">
                        {slide.subtitle}
                      </div>
                    )}
                    
                    {/* Title */}
                    {slide.title && (
                      <h3 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight drop-shadow-lg">
                        {slide.title}
                      </h3>
                    )}
                    
                    {/* Description */}
                    {slide.description && (
                      <p className="text-xs sm:text-sm lg:text-base text-white/90 leading-relaxed max-w-lg drop-shadow-md line-clamp-2">
                        {slide.description}
                      </p>
                    )}


                    
                    {/* CTA Button */}
                    {slide.cta && (
                      <div className="pt-1 sm:pt-2">
                        <LocalizedClientLink 
                          href={slide.href} 
                          className="group inline-flex items-center gap-1.5 px-3 sm:px-5 lg:px-6 py-1.5 sm:py-2 lg:py-2.5 rounded-full bg-white text-red-600 font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{slide.cta}</span>
                          <span aria-hidden="true" className="text-sm group-hover:translate-x-1 transition-transform">→</span>
                        </LocalizedClientLink>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Clickable link for banners without text */}
            {!slide.hasContent && slide.href && slide.href !== "/" && (
              <LocalizedClientLink 
                href={slide.href}
                className="absolute inset-0 z-10"
                aria-label="View banner"
              />
            )}
          </div>
        ))}
      </div>

      {/* Dot indicators - only show if multiple slides */}
      {total > 1 && (
        <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 bg-black/30 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
          {slides.map((_slide, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation()
                setCurrent(idx)
              }}
              className={`rounded-full transition-all duration-300 ${
                idx === current 
                  ? "bg-white w-5 sm:w-6 lg:w-8 h-1.5 sm:h-2" 
                  : "bg-white/50 hover:bg-white/80 w-1.5 sm:w-2 h-1.5 sm:h-2"
              }`}
              aria-label={`Перейти к слайду ${idx + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Navigation arrows - show on hover for desktop */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 hover:opacity-100 sm:opacity-60 hover:bg-black/50 transition-all duration-300"
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 hover:opacity-100 sm:opacity-60 hover:bg-black/50 transition-all duration-300"
            aria-label="Next slide"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
