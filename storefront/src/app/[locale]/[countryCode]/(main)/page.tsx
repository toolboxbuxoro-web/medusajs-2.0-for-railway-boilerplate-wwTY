import { Metadata } from "next"
export const dynamic = 'force-dynamic'

import FeaturedProducts from "@modules/home/components/featured-products"
import BannerSlider from "@modules/home/components/banner-slider"
import ValuePropositionBlocks from "@modules/home/components/value-proposition-blocks"
import PartnersBrandBlock from "@modules/home/components/partners"
import InfiniteCollections from "@modules/home/components/infinite-collections"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { getTranslations } from 'next-intl/server'
import { listBanners } from "@lib/data/banners"
import { generateAlternates } from "@lib/util/seo"

type Props = {
  params: Promise<{ countryCode: string; locale: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { countryCode, locale } = params
  const t = await getTranslations({ locale, namespace: 'home' })
  
  return {
    title: t('seo_title'),
    description: t('seo_description'),
    alternates: generateAlternates(countryCode, "/", locale),
  }
}

export default async function Home(props: Props) {
  const params = await props.params
  const { countryCode, locale } = params
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)
  
  const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"


  const tHome = await getTranslations({ locale, namespace: 'home' })
  const banners = await listBanners()

  const safeCollections = collections || []

  return (
    <>
      <div className="content-container px-4 md:px-6 pt-2 sm:pt-4">
        <BannerSlider slides={banners} />
      </div>

      <div className="bg-white py-8 sm:py-12">
        <div className="content-container">
          <div className="flex flex-col gap-y-8">
            {/* 1. First Collection (Winter Theme) */}
            {safeCollections[0] && region && (
              <ul className="flex flex-col gap-y-8 list-none p-0 m-0">
                <FeaturedProducts collections={[safeCollections[0]]} region={region} locale={locale} />
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 2. Value Proposition Blocks (B2B, etc) */}
      <ValuePropositionBlocks locale={locale} />
      
      <div className="bg-white py-8 sm:py-12">
        <div className="content-container">
          <div className="flex flex-col gap-y-8">
            {/* 3. Second Collection */}
            {safeCollections[1] && region && (
              <ul className="flex flex-col gap-y-8 list-none p-0 m-0">
                <FeaturedProducts collections={[safeCollections[1]]} region={region} locale={locale} offset={1} />
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 4. Partners / Brands Block */}
      <PartnersBrandBlock />

      {/* 5. Remaining Collections with Infinite Scroll */}
      <div className="bg-white py-8 sm:py-12">
        <div className="content-container">
          {region ? (
            <InfiniteCollections
              initialOffset={2}
              countryCode={countryCode}
              locale={locale}
              region={region}
            />
          ) : safeCollections.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 italic">
                {tHome('products_loading')}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
