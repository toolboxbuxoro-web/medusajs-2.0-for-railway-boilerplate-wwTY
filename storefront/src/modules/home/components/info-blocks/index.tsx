import { getTranslations } from 'next-intl/server'
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function InfoBlocks() {
  const t = await getTranslations('home')

  const blocks = [
    {
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      bgColor: 'bg-green-100',
      title: t('warranty_title') || 'Original goods with warranty',
      description: t('warranty_desc') || 'All products come with manufacturer warranty',
      link: '/warranty',
    },
    {
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-blue-100',
      title: t('delivery_title') || '99% of orders delivered on time',
      description: t('delivery_desc') || 'Fast and reliable delivery service',
      link: '/delivery',
    },
    {
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bgColor: 'bg-red-100',
      title: t('stores_title') || '1,200+ stores across the country',
      description: t('stores_desc') || 'Pick up your order from any store',
      link: '/stores',
    },
  ]

  return (
    <div className="bg-gray-50 section-padding">
      <div className="content-container">
        {/* Mobile: Horizontal scroll */}
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {blocks.map((block, index) => (
              <div key={index} className="flex-shrink-0 w-72 bg-white rounded-xl p-4 shadow-sm">
                <div className={`w-10 h-10 ${block.bgColor} rounded-full flex items-center justify-center mb-3`}>
                  {block.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{block.title}</h3>
                <p className="text-gray-600 text-xs mb-3 line-clamp-2">{block.description}</p>
                <LocalizedClientLink 
                  href={block.link}
                  className="text-red-600 hover:text-red-700 font-semibold text-xs inline-flex items-center gap-1"
                >
                  {t('details') || 'Details'}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </LocalizedClientLink>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet and Desktop: Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {blocks.map((block, index) => (
            <div key={index} className="bg-white rounded-xl p-5 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${block.bgColor} rounded-full flex items-center justify-center mb-3 sm:mb-4`}>
                {block.icon}
              </div>
              <h3 className="font-semibold text-base lg:text-lg mb-2">{block.title}</h3>
              <p className="text-gray-600 text-sm mb-3 lg:mb-4">{block.description}</p>
              <LocalizedClientLink 
                href={block.link}
                className="text-red-600 hover:text-red-700 font-semibold text-sm inline-flex items-center gap-1"
              >
                {t('details') || 'Details'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </LocalizedClientLink>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
