import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Heading, Text, Button, Badge } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'stores_page' })
  
  return {
    title: t('seo.title'),
    description: t('seo.description'),
  }
}

export default async function StoresPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'stores_page' })

  const bukharaStores = [
    {
      name: t('city_bukhara.stores.store1'),
      link: "https://2gis.uz/bukhara/branches/70000001084551975/firm/70000001084551976/64.410127%2C39.782133"
    },
    {
      name: t('city_bukhara.stores.store2'),
      link: "https://2gis.uz/bukhara/branches/70000001084551975/firm/70000001094186735/64.391297%2C39.776084"
    },
    {
      name: t('city_bukhara.stores.store3'),
      link: "https://2gis.uz/bukhara/branches/70000001084551975/firm/70000001094187132/64.389739%2C39.782593"
    }
  ]

  return (
    <div className="bg-white pb-16 pt-8">
      {/* HERO SECTION */}
      <div className="content-container flex flex-col items-center text-center gap-y-6 py-12 md:py-16">
        <Heading level="h1" className="text-3xl md:text-5xl font-extrabold tracking-tight text-ui-fg-base">
          {t('hero.title')}
        </Heading>
        <div className="flex flex-col gap-y-2 max-w-[800px]">
          <Text className="text-xl md:text-2xl font-medium text-ui-fg-subtle">
            {t('hero.subtitle')}
          </Text>
        </div>
      </div>

      {/* CITY SECTION: BUKHARA */}
      <div className="content-container py-12">
        <Heading level="h2" className="text-2xl md:text-3xl font-bold mb-10">
          {t('city_bukhara.title')}
        </Heading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bukharaStores.map((store, index) => (
            <div key={index} className="flex flex-col p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <div className="flex flex-col gap-y-2 mb-6">
                <Heading level="h3" className="text-xl font-bold">
                  {store.name}
                </Heading>
                <Text className="text-ui-fg-subtle text-sm">
                  {t('store_card.description')}
                </Text>
              </div>
              <div className="mt-auto">
                <a href={store.link} target="_blank" rel="noopener noreferrer" className="w-full block">
                  <Button variant="secondary" className="w-full">
                    {t('store_card.route')}
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMING SOON SECTION */}
      <div className="bg-gray-50 py-16 mt-12">
        <div className="content-container">
          <Heading level="h2" className="text-2xl md:text-3xl font-bold mb-10">
            {t('coming_soon.title')}
          </Heading>
          
          <div className="max-w-md">
            <div className="flex flex-col p-6 rounded-2xl border border-gray-200 bg-white shadow-sm opacity-80">
              <div className="flex justify-between items-center mb-2">
                <Text className="text-lg font-bold">
                  {t('coming_soon.city')}
                </Text>
                <Badge color="grey">
                  {t('coming_soon.badge')}
                </Badge>
              </div>
              <Text className="text-ui-fg-subtle text-sm font-medium mb-3">
                {t('coming_soon.region')}
              </Text>
              <Text className="text-ui-fg-subtle italic">
                {t('coming_soon.text')}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* INFO BLOCK */}
      <div className="content-container py-16">
        <div className="max-w-[800px] mx-auto p-8 rounded-3xl bg-blue-50 border border-blue-100 flex flex-col gap-y-6">
          <div className="flex items-center justify-center gap-x-3 text-blue-900">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <Text className="text-xl font-bold uppercase tracking-wider">
              {t('info_block.important')}
            </Text>
          </div>
          <div className="flex flex-col gap-y-4 text-center">
            <Text className="text-lg text-blue-950 font-semibold leading-relaxed">
              {t('info_block.text_offline')}
            </Text>
            <div className="h-px bg-blue-200 w-1/3 mx-auto" />
            <Text className="text-lg text-blue-900 font-medium leading-relaxed">
              {t('info_block.text_online')}
            </Text>
          </div>
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="content-container flex flex-col items-center text-center gap-6 py-12 md:py-16">
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <LocalizedClientLink href="/store">
              <Button size="large" variant="primary" className="w-full sm:w-auto min-w-[200px]">
                {t('cta.catalog')}
              </Button>
            </LocalizedClientLink>
            
            <LocalizedClientLink href="/delivery">
              <Button size="large" variant="secondary" className="w-full sm:w-auto min-w-[200px]">
                {t('cta.delivery')}
              </Button>
            </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
