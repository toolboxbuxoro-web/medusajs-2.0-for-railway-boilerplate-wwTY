import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import BannerSlider from "@modules/home/components/banner-slider"
import TopCategories from "@modules/home/components/top-categories"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getTranslations } from 'next-intl/server'
import { listBanners } from "@lib/data/banners"
import { generateAlternates } from "@lib/util/seo"

type Props = {
  params: { countryCode: string; locale: string }
}

export async function generateMetadata({ params: { countryCode, locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'home' })
  
  return {
    title: t('seo_title'),
    description: t('seo_description'),
    alternates: generateAlternates(countryCode, "/", locale),
  }
}

export default async function Home({
  params: { countryCode, locale },
}: Props) {
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tHome = await getTranslations({ locale, namespace: 'home' })
  const banners = await listBanners()

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <div className="content-container px-4 md:px-6 pt-6 sm:pt-8">
        <BannerSlider slides={banners} />
      </div>

      <TopCategories locale={locale} collections={collections} />
      
      {/* Featured Products Section */}
      <div className="bg-white py-12 sm:py-16 lg:py-24">
        <div className="content-container">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h2 className="heading-2">{tHome('popular_products')}</h2>
            <LocalizedClientLink 
              href="/store"
              className="text-sm sm:text-base font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1.5 whitespace-nowrap relative left-3 top-6"
            >
              <span>{tNav('all_products')}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </LocalizedClientLink>
          </div>
          <div className="flex flex-col gap-y-12">
            <FeaturedProducts collections={collections} region={region} locale={locale} />
          </div>
        </div>
      </div>
    </>
  )
}

