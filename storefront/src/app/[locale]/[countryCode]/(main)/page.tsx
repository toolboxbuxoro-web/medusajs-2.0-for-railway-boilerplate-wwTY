import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import BannerSlider from "@modules/home/components/banner-slider"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: "Toolbox - Профессиональные инструменты и оборудование",
  description:
    "Интернет-гипермаркет для профессионалов и бизнеса. Оригинальные товары для строительства, ремонта и производства.",
}

export default async function Home({
  params: { countryCode, locale },
}: {
  params: { countryCode: string; locale: string }
}) {
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)
  const t = await getTranslations('nav')

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <div className="content-container px-4 md:px-6 pt-6 sm:pt-8">
        <BannerSlider />
      </div>
      
      {/* Featured Products Section */}
      <div className="bg-white section-padding">
        <div className="content-container">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="heading-2">Популярные товары</h2>
            <LocalizedClientLink 
              href="/store"
              className="text-sm sm:text-base font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>{t('all_products') || 'Все товары'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </LocalizedClientLink>
          </div>
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} locale={locale} />
          </ul>
        </div>
      </div>
    </>
  )
}
