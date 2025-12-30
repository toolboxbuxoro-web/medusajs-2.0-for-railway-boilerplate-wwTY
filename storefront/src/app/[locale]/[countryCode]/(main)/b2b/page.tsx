import { Metadata } from "next"
import { getTranslations } from 'next-intl/server'
import { generateAlternates } from "@lib/util/seo"
import { B2BForm } from "@modules/b2b/components/b2b-form"

type Props = {
  params: { countryCode: string; locale: string }
}

export async function generateMetadata({ params: { countryCode, locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'b2b' })
  
  return {
    title: t('seo_title'),
    description: t('seo_description'),
    alternates: generateAlternates(countryCode, "/b2b", locale),
  }
}

export default async function B2BPage({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: 'b2b' })
  const isRussian = locale === 'ru'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16">
      <div className="content-container max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-600 text-white mb-6 shadow-lg">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {isRussian ? 'Работаем с юридическими лицами' : 'Yuridik shaxslar bilan ishlaymiz'}
          </h1>
          <p className="text-lg text-gray-600">
            {isRussian 
              ? 'Оставьте заявку и наш менеджер свяжется с вами в ближайшее время' 
              : 'Ariza qoldiring va menejerimiz tez orada siz bilan bog\'lanadi'}
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">
              {isRussian ? 'Полный пакет документов' : 'To\'liq hujjatlar'}
            </h3>
            <p className="text-sm text-gray-600">
              {isRussian ? 'Договор, акты, счета для бухгалтерии' : 'Shartnoma, dalolatnoma, buxgalteriya uchun hisoblar'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center text-red-600 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">
              {isRussian ? 'Быстрая обработка' : 'Tez qayta ishlash'}
            </h3>
            <p className="text-sm text-gray-600">
              {isRussian ? 'Ответ в течение 24 часов' : '24 soat ichida javob'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {isRussian ? 'Оставить заявку' : 'Ariza qoldirish'}
          </h2>
          
          <B2BForm isRussian={isRussian} />
        </div>
      </div>
    </div>
  )
}
