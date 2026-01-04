import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Heading, Text, Button, Container } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"
import { generateAlternates } from "@lib/util/seo"

export async function generateMetadata({ params: { locale, countryCode } }: { params: { locale: string; countryCode: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'delivery_page' })
  
  return {
    title: `${t('title')} | Toolbox`,
    description: t('description'),
    alternates: generateAlternates(countryCode, "/delivery", locale),
  }
}

export default async function DeliveryPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'delivery_page' })

  // Icons for steps (Inline SVGs for reliability)
  const Icons = {
    Order: () => (
      <svg role="img" aria-label="Order" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    Location: () => (
      <svg role="img" aria-label="Location" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    Pack: () => (
      <svg role="img" aria-label="Pack" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    Pickup: () => (
      <svg role="img" aria-label="Pickup" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
        <path d="M20 10h-3" />
        <path d="M2 10h3" />
        <rect x="5" y="6" width="14" height="12" rx="2" />
        <path d="M12 6v12" />
      </svg>
    )
  }

  return (
    <div className="bg-white pb-16 pt-8">
      {/* Hero Section */}
      <div className="content-container flex flex-col items-center text-center gap-y-6 py-12 md:py-16">
        <Heading level="h1" className="text-3xl md:text-5xl font-extrabold tracking-tight text-ui-fg-base">
          {t('title')}
        </Heading>
        <div className="flex flex-col gap-y-4 max-w-[700px]">
          <Text className="text-xl md:text-2xl font-medium text-ui-fg-base">
            {t('subtitle')}
          </Text>
          <Text className="text-ui-fg-subtle text-lg leading-relaxed">
            {t('description')}
          </Text>
        </div>
      </div>

      {/* How it works Section */}
      <div className="w-full bg-gray-50 py-16">
        <div className="content-container">
          <Heading level="h2" className="text-2xl md:text-3xl font-bold text-center mb-12">
            {t('how_it_works.title')}
          </Heading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
              <div className="p-4 bg-red-50 rounded-full mb-2">
                <Icons.Order />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-red-600 uppercase tracking-widest">01</span>
                <Text className="text-lg font-semibold">{t('how_it_works.step_1')}</Text>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
              <div className="p-4 bg-red-50 rounded-full mb-2">
                <Icons.Location />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-red-600 uppercase tracking-widest">02</span>
                <Text className="text-lg font-semibold">{t('how_it_works.step_2')}</Text>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
              <div className="p-4 bg-red-50 rounded-full mb-2">
                <Icons.Pack />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-red-600 uppercase tracking-widest">03</span>
                <Text className="text-lg font-semibold">{t('how_it_works.step_3')}</Text>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
              <div className="p-4 bg-red-50 rounded-full mb-2">
                <Icons.Pickup />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-red-600 uppercase tracking-widest">04</span>
                <Text className="text-lg font-semibold">{t('how_it_works.step_4')}</Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid: Location & Timing */}
      <div className="content-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          
          {/* Where to Pickup */}
          <div className="flex flex-col gap-4 p-8 border border-gray-200 rounded-2xl bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg text-ui-fg-base">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <Heading level="h3" className="text-xl font-bold">
                {t('where_to_pickup.title')}
              </Heading>
            </div>
            <Text className="text-ui-fg-subtle text-base">
              {t('where_to_pickup.description')}
            </Text>
            <div className="mt-auto pt-4 border-t border-gray-100">
               <Text className="text-sm text-gray-500 italic">
                {t('where_to_pickup.note')}
               </Text>
            </div>
          </div>

          {/* Timing & Cost */}
          <div className="flex flex-col gap-4 p-8 border border-gray-200 rounded-2xl bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg text-ui-fg-base">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <Heading level="h3" className="text-xl font-bold">
                {t('timing_cost.title')}
              </Heading>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-semibold text-gray-900 mb-1">Сроки</span>
                <Text className="text-ui-fg-subtle">
                  {t('timing_cost.timing')}
                </Text>
              </div>
              <div>
                <span className="block text-sm font-semibold text-gray-900 mb-1">Стоимость</span>
                <ul className="list-disc list-inside text-ui-fg-subtle">
                  <li>{t('timing_cost.cost_free')}</li>
                  <li>{t('timing_cost.cost_paid')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="w-full bg-gray-50 py-16">
        <div className="content-container max-w-[800px]">
          <Heading level="h2" className="text-2xl md:text-3xl font-bold text-center mb-10">
            {t('faq.title')}
          </Heading>
          
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <Heading level="h3" className="text-lg font-semibold mb-2">
                  {t(`faq.q${i}`)}
                </Heading>
                <Text className="text-ui-fg-subtle">
                  {t(`faq.a${i}`)}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="content-container flex flex-col items-center text-center gap-6 py-16">
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <LocalizedClientLink href="/store">
              <Button size="large" variant="primary" className="w-full sm:w-auto min-w-[200px]">
                {t('cta.shop_now')}
              </Button>
            </LocalizedClientLink>
            
            <LocalizedClientLink href="/customer-service#contact-form">
              <Button size="large" variant="secondary" className="w-full sm:w-auto min-w-[200px]">
                {t('cta.contact_support')}
              </Button>
            </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
