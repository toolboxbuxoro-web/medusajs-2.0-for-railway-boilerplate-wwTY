"use client"

import Image from 'next/image'
import { useTranslations } from 'next-intl'

// Brand logos from public/images (excluding b2b-sales)
// Renamed to lowercase for better compatibility
const brandLogos = [
  { src: "/images/boda.jpg", alt: "BODA" },
  { src: "/images/crown.jpg", alt: "CROWN" },
  { src: "/images/epa.jpg", alt: "EPA" },
  { src: "/images/makita.jpg", alt: "MAKITA" },
  { src: "/images/pit.jpg", alt: "PIT" },
  { src: "/images/ubay.jpg", alt: "UBAY" },
  { src: "/images/alteco.jpg", alt: "Alteco" },
  { src: "/images/biyoti.jpg", alt: "Biyoti" },
  { src: "/images/dewalt.jpg", alt: "DeWalt" },
  { src: "/images/number_one.jpg", alt: "Number One" },
  { src: "/images/recanta.jpg", alt: "Recanta" },
  { src: "/images/shturm.jpg", alt: "Shturm" },
]

export default function PartnersBrandBlock() {
  const t = useTranslations('home')

  return (
    <div className="py-8 sm:py-12 bg-gray-50 border-y border-gray-100 mb-8 sm:mb-12">
      <div className="content-container mb-6 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
          {t('our_partners') || "Наши партнеры"}
        </h2>
      </div>

      <div className="relative flex overflow-hidden">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-32 bg-gradient-to-r from-gray-50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-32 bg-gradient-to-l from-gray-50 to-transparent z-10" />
        
        {/* Infinite scrolling container - two identical sets for seamless loop */}
        <div className="flex animate-partners-scroll">
          {/* First set of logos */}
          {brandLogos.map((brand, index) => (
            <div 
              key={`brand-1-${index}`} 
              className="mx-4 sm:mx-8 flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-2"
            >
              <Image
                src={brand.src}
                alt={brand.alt}
                width={128}
                height={128}
                className="max-w-full max-h-full object-contain block opacity-100"
                quality={80}
                sizes="(max-width: 640px) 96px, 128px"
              />
            </div>
          ))}
          {/* Second set of logos (duplicate for seamless loop) */}
          {brandLogos.map((brand, index) => (
            <div 
              key={`brand-2-${index}`} 
              className="mx-4 sm:mx-8 flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center p-2"
            >
              <Image
                src={brand.src}
                alt={brand.alt}
                width={128}
                height={128}
                className="max-w-full max-h-full object-contain block opacity-100"
                quality={80}
                sizes="(max-width: 640px) 96px, 128px"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

