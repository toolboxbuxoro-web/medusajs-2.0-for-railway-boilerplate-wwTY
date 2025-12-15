"use client"

import { useEffect, useMemo, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams } from "next/navigation"

import { bannerSlides } from "../../../../data/banner-slides"
import type { Banner } from "@lib/data/banners"

const AUTOPLAY_INTERVAL = 6000

type Slide = (typeof bannerSlides)[number] & Partial<Banner>

export default function BannerSlider({ slides: serverSlides }: { slides?: Banner[] }) {
  const [current, setCurrent] = useState(0)
  const { locale } = useParams()

  const slides = useMemo(() => {
    if (serverSlides?.length) {
      // normalize to the shape used by component
      return serverSlides.map((b) => ({
        id: b.id,
        title: (locale === "uz" && b.title_uz) ? b.title_uz : (b.title || ""),
        subtitle: (locale === "uz" && b.subtitle_uz) ? b.subtitle_uz : (b.subtitle || ""),
        description: (locale === "uz" && b.description_uz) ? b.description_uz : (b.description || ""),
        cta: (locale === "uz" && b.cta_uz) ? b.cta_uz : (b.cta || ""),
        href: b.href || "/",
        image_url: b.image_url,
        // fallback background if image missing
        background: "linear-gradient(135deg, #111827 0%, #374151 60%, #111827 100%)",
      }))
    }
    return bannerSlides
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSlides, locale])
  const total = slides.length

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total)
    }, AUTOPLAY_INTERVAL)

    return () => clearInterval(id)
  }, [total])

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl sm:shadow-2xl shadow-red-500/10 mb-4 sm:mb-6 lg:mb-10">
      {/* Responsive height: mobile 180px, tablet 240px, desktop 280px */}
      <div className="relative h-[180px] sm:h-[240px] lg:h-[280px]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-out ${index === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
            style={{
              ...(slide.image_url
                ? {
                    backgroundImage: `url(${slide.image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : { background: (slide as any).background }),
            }}
          >
            {/* Decorative circles - hidden on mobile for better performance */}
            <div className="hidden sm:block absolute top-10 right-10 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="hidden sm:block absolute bottom-10 right-1/4 w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-white/5 blur-2xl"></div>
            
            <div className="h-full w-full bg-gradient-to-r from-black/70 via-black/50 sm:via-black/40 to-transparent flex items-center relative">
              <div className="content-container h-full flex items-center py-4 sm:py-6 lg:py-8">
                <div className="max-w-full sm:max-w-xl lg:max-w-2xl text-white space-y-2 sm:space-y-3 lg:space-y-4 relative z-10">
                  {/* Icon Badge */}
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                    {slide.id === 'bf' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                    {slide.id === 'pro' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {slide.id === 'delivery' && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                      </svg>
                    )}
                    <span className="text-[9px] sm:text-[10px] lg:text-xs font-semibold tracking-wide sm:tracking-wider uppercase">
                      {slide.subtitle}
                    </span>
                  </div>
                  
                  {/* Title - responsive font sizes */}
                  <h3 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight drop-shadow-lg">
                    {slide.title}
                  </h3>
                  
                  {/* Description - hide on very small screens, show abbreviated version */}
                  <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-white/95 leading-relaxed max-w-xl drop-shadow-md line-clamp-2 sm:line-clamp-3">
                    {slide.description}
                  </p>
                  
                  {/* CTA Button - responsive sizing */}
                  <div className="pt-1 sm:pt-2 lg:pt-3">
                    <LocalizedClientLink 
                      href={slide.href} 
                      className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 lg:px-7 py-2 sm:py-2.5 lg:py-3.5 rounded-full bg-white text-red-600 font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wide shadow-lg sm:shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/50 sm:border-2"
                    >
                      <span>{slide.cta}</span>
                      <span aria-hidden="true" className="text-sm sm:text-base lg:text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls - responsive positioning and sizing */}
      <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 lg:gap-3 bg-black/30 backdrop-blur-md px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 rounded-full border border-white/20 shadow-lg">
        {slides.map((_slide, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === current 
                ? "bg-white w-6 sm:w-8 lg:w-10 h-1.5 sm:h-2 lg:h-2.5" 
                : "bg-white/50 hover:bg-white/80 w-1.5 sm:w-2 lg:w-2.5 h-1.5 sm:h-2 lg:h-2.5"
            }`}
            aria-label={`Перейти к слайду ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

