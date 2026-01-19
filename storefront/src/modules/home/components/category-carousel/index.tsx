import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getCategoriesList } from "@lib/data/categories"
import { getTranslations } from 'next-intl/server'

type CategoryType = HttpTypes.StoreProductCategory & {
  metadata?: {
    icon_url?: string
    image_url?: string
    [key: string]: unknown
  }
}
import Image from "next/image"

const categoryIcons: Record<string, string> = {
  'tools': '🔧',
  'power-tools': '⚡',
  'hand-tools': '🔨',
  'garden': '🌱',
  'construction': '🏗️',
  'electrical': '💡',
  'plumbing': '🔩',
  'paint': '🎨',
  'default': '🛠️',
}

export default async function CategoryCarousel() {
  const { product_categories } = await getCategoriesList(0, 12)
  const categories = (product_categories?.filter((cat: HttpTypes.StoreProductCategory) => !cat.parent_category).slice(0, 12) || []) as CategoryType[]
  const t = await getTranslations('home')

  return (
    <div className="bg-white section-padding">
      <div className="content-container">
        <h2 className="heading-2 mb-4 sm:mb-6 lg:mb-8 text-center">
          {t('hypermarket_title') || 'Online hypermarket for professionals and business'}
        </h2>
        <p className="text-gray-600 text-center mb-6 sm:mb-8 max-w-2xl mx-auto text-sm sm:text-base">
          {t('hypermarket_subtitle') || 'Find everything you need for construction, repair, and production'}
        </p>
        
        {/* Desktop Grid */}
        <div className="hidden sm:grid grid-categories">
          {categories.map((category) => (
            <LocalizedClientLink
              key={category.id}
              href={`/categories/${category.handle}`}
              className="card-interactive p-4 lg:p-6 text-center group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-3 lg:mb-4 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-red-50 transition-colors relative overflow-hidden">
                {category.metadata?.image_url ? (
                  <Image
                    src={category.metadata.image_url as string}
                    alt=""
                    className="w-full h-full object-cover"
                    fill
                    sizes="(max-width: 640px) 48px, 64px"
                  />
                ) : category.metadata?.icon_url ? (
                  <Image
                    src={category.metadata.icon_url as string}
                    alt=""
                    className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 object-contain"
                    width={40}
                    height={40}
                  />
                ) : (
                  <span className="text-xl sm:text-2xl lg:text-3xl">
                    {categoryIcons[category.handle || ''] || categoryIcons.default}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-xs sm:text-sm lg:text-base line-clamp-2">{category.name}</h3>
            </LocalizedClientLink>
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="sm:hidden -mx-4 px-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map((category) => (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="flex-shrink-0 w-24 card-interactive p-3 text-center group"
              >
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-red-50 transition-colors relative overflow-hidden">
                  {category.metadata?.image_url ? (
                    <Image
                      src={category.metadata.image_url as string}
                      alt=""
                      className="w-full h-full object-cover"
                      fill
                      sizes="48px"
                    />
                  ) : category.metadata?.icon_url ? (
                    <Image
                      src={category.metadata.icon_url as string}
                      alt=""
                      className="w-8 h-8 object-contain"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <span className="text-xl">
                      {categoryIcons[category.handle || ''] || categoryIcons.default}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-xs line-clamp-2">{category.name}</h3>
              </LocalizedClientLink>
            ))}
          </div>
        </div>

        {/* View All Link */}
        <div className="text-center mt-6 sm:mt-8">
          <LocalizedClientLink 
            href="/store" 
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm sm:text-base"
          >
            {t('view_all_categories') || 'View All Categories'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
