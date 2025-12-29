"use client"

import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ValuePropositionBlocksProps = {
  locale: string
}

export default function ValuePropositionBlocks({ locale }: ValuePropositionBlocksProps) {
  const isRussian = locale === 'ru'

  return (
    <>
      <div className="py-8 sm:py-12 bg-gray-50/50">
        <div className="content-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Large Card: B2B (Takes 2 columns on large screens) */}
            <LocalizedClientLink
              href="/b2b"
              className="lg:col-span-2 group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:border-red-100 flex flex-row-reverse h-full"
            >
              <div className="relative w-[40%] sm:w-1/2 min-h-[160px] sm:min-h-full p-3 sm:p-8 flex items-center justify-center bg-gray-50/50">
                <div className="relative w-24 h-24 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-inner ring-2 sm:ring-4 ring-white">
                  <Image
                    src="/images/b2b-sales.jpg"
                    alt="B2B"
                    fill
                    sizes="(max-width: 768px) 100px, 200px"
                    className="object-cover transition-transform duration-700 hover:scale-110"
                  />
                </div>
              </div>
              <div className="p-4 sm:p-8 flex flex-col justify-center w-[60%] sm:w-1/2">
                <div className="mb-2 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
                   <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
                    </svg>
                </div>
                <h3 className="text-sm sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-red-600 transition-colors">
                  {isRussian ? 'Работаем с юр. лицами' : 'Yuridik shaxslar bilan'}
                </h3>
                <p className="hidden sm:block text-gray-600 mb-6">
                  {isRussian 
                    ? 'Полный пакет документов, НДС, отсрочка платежа для постоянных партнеров.' 
                    : 'Hujjatlarning to\'liq to\'plami, QQS, doimiy hamkorlar uchun to\'lovni kechiktirish.'}
                </p>
                <div className="inline-flex items-center text-[10px] sm:text-base text-red-600 font-semibold group-hover:gap-2 transition-all">
                  {isRussian ? 'Оставить заявку' : 'Ariza qoldirish'} 
                  <span className="ml-1">→</span>
                </div>
              </div>
            </LocalizedClientLink>

            {/* Right Column: Stacked Cards */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              
              {/* Card 2: Service Center */}
              <div className="flex-1 group rounded-2xl bg-white border border-gray-100 shadow-sm p-6 transition-all hover:shadow-lg hover:border-red-100 flex items-center gap-4">
                <div className="shrink-0 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {isRussian ? 'Сервисный центр' : "Xizmat markazi"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {isRussian ? 'Гарантийный ремонт и обслуживание' : 'Kafolatli ta\'mirlash va xizmat ko\'rsatish'}
                  </p>
                </div>
              </div>

              {/* Card 3: Customers */}
              <div className="flex-1 group rounded-2xl bg-white border border-gray-100 shadow-sm p-6 transition-all hover:shadow-lg hover:border-red-100 flex items-center gap-4">
                <div className="shrink-0 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-black text-sm border border-red-100">
                  8K+
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {isRussian ? '8000+ клиентов' : '8000+ mijozlar'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {isRussian ? 'Доверяют нам свой выбор' : 'Bizga o\'z tanlovini ishonishadi'}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </>
  )
}
