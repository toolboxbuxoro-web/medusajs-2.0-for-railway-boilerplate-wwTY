import { Metadata } from "next"
export const dynamic = 'force-dynamic'

import FeaturedProducts from "@modules/home/components/featured-products"
import BannerSlider from "@modules/home/components/banner-slider"
import ValuePropositionBlocks from "@modules/home/components/value-proposition-blocks"
import PartnersBrandBlock from "@modules/home/components/partners"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
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
  
  const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

  console.log(`[CONFIG] !!!!!!!! CURRENT BACKEND URL IS: ${MEDUSA_BACKEND_URL} !!!!!!!!`)
  console.log(`[Homepage Debug] Render start. countryCode: ${countryCode}, locale: ${locale}`)
  console.log(`[Homepage Debug] Collections count: ${collections?.length || 0}`)
  if (collections && collections.length > 0) {
    console.log(`[Homepage Debug] Collections titles: ${collections.map(c => c.title).join(", ")}`)
    collections.forEach(c => {
      console.log(`[Homepage Debug] Collection: ${c.title}, Products: ${c.products?.length || 0}`)
    })
  } else {
    console.log(`[Homepage Debug] NO COLLECTIONS RETURNED!`)
  }

  const tHome = await getTranslations({ locale, namespace: 'home' })
  const banners = await listBanners()

  const safeCollections = collections || []

  return (
    <>
      <div className="bg-red-50 text-red-700 text-[10px] p-1 text-center font-mono">
        DEBUG: {safeCollections.map(c => c.handle).join(' | ')} | REGION: {region?.id} | TIME: {new Date().toLocaleTimeString()}
      </div>
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

      {/* 5. Remaining Collections */}
      <div className="bg-white py-8 sm:py-12">
        <div className="content-container">
          <div className="flex flex-col gap-y-8">
            {safeCollections.length > 2 && region ? (
              <ul className="flex flex-col gap-y-8 list-none p-0 m-0">
                <FeaturedProducts collections={safeCollections.slice(2)} region={region} locale={locale} offset={2} />
              </ul>
            ) : safeCollections.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 italic">
                  {tHome('products_loading')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
