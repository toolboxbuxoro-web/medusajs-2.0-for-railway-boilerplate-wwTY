"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type BannerData = {
  image_url: string
  title: string
  description: string
  cta: string
  href: string
}

type CollectionBannerProps = {
  collection: HttpTypes.StoreCollection
  locale: string
}

export default function CollectionBanner({ collection, locale }: CollectionBannerProps) {
  const metadata = collection.metadata as Record<string, any> | undefined
  
  // Get banner for current locale with fallback
  const bannerKey = locale === "uz" ? "banner_uz" : "banner_ru"
  const fallbackKey = locale === "uz" ? "banner_ru" : "banner_uz"
  
  const banner: BannerData | undefined = metadata?.[bannerKey] || metadata?.[fallbackKey]
  
  // Don't render if no banner data or no image
  if (!banner?.image_url) {
    return null
  }

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl sm:shadow-2xl mb-2 sm:mb-4 lg:mb-6">
      {/* Aspect ratio: 3:1 mobile, 6:1 desktop */}
      <div className="relative w-full aspect-[3/1] sm:aspect-[6/1]">
        {/* Background image */}
        <Image 
          src={banner.image_url} 
          alt={banner.title || "Banner"} 
          className="absolute inset-0 w-full h-full object-cover"
          fill
          priority
          sizes="100vw"
        />
        
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="content-container h-full flex items-center py-4 sm:py-6 lg:py-8">
            <div className="max-w-[85%] sm:max-w-xl lg:max-w-2xl text-white space-y-1.5 sm:space-y-3 lg:space-y-4">
              
              {banner.title && (
                <h2 className="text-lg sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-snug drop-shadow-lg">
                  {banner.title}
                </h2>
              )}
              
              {banner.description && (
                <p className="text-[11px] sm:text-sm lg:text-base xl:text-lg text-white/95 leading-snug sm:leading-relaxed max-w-xl drop-shadow-md line-clamp-2 sm:line-clamp-3">
                  {banner.description}
                </p>
              )}
              
              {/* CTA Button */}
              {banner.cta && banner.href && (
                <div className="pt-1 sm:pt-2 lg:pt-3">
                  <LocalizedClientLink 
                    href={banner.href}
                    className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 lg:px-7 py-2 sm:py-2.5 lg:py-3.5 rounded-full bg-white text-red-600 font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wide shadow-lg sm:shadow-xl shadow-black/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/50 sm:border-2"
                  >
                    <span>{banner.cta}</span>
                    <span aria-hidden="true" className="text-sm sm:text-base lg:text-lg group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </LocalizedClientLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
