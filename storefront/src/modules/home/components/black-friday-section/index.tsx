import { HttpTypes } from "@medusajs/types"
import { getProductsList } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getTranslations } from 'next-intl/server'

export default async function BlackFridaySection({
  countryCode,
  region,
}: {
  countryCode: string
  region: HttpTypes.StoreRegion
}) {
  const { response } = await getProductsList({
    countryCode,
    queryParams: { limit: 8 },
  })

  const products = response.products || []
  const t = await getTranslations('home')

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white section-padding relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="content-container relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
              {t('bf_dates') || 'November 5 - 30'}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {t('bf_title') || 'Black Friday: at full power!'}
            </h2>
          </div>
          <LocalizedClientLink
            href="/black-friday"
            className="hidden sm:inline-flex px-5 py-2.5 sm:px-6 sm:py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold text-sm sm:text-base"
          >
            {t('view_all') || 'View All'}
          </LocalizedClientLink>
        </div>

        {/* Products - Horizontal scroll on all sizes */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto no-scrollbar pb-4">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex-shrink-0 w-40 sm:w-48 lg:w-56 xl:w-64"
              >
                <ProductPreview product={product} region={region} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: View All Button */}
        <div className="sm:hidden text-center mt-4">
          <LocalizedClientLink
            href="/black-friday"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-semibold w-full"
          >
            {t('view_all') || 'View All'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
