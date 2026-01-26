import { notFound } from "next/navigation"
import { Suspense } from "react"
import Image from "next/image"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { getLocalizedField } from "@lib/util/localization"

export default function CategoryTemplate({
  categories,
  sortBy,
  page,
  countryCode,
  locale,
}: {
  categories: HttpTypes.StoreProductCategory[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
  locale: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const category = categories[categories.length - 1]
  const parents = categories.slice(0, categories.length - 1)

  if (!category || !countryCode) notFound()

  const CategoryMedia = ({ c }: { c: HttpTypes.StoreProductCategory }) => {
    // Для внутренних категорий используем ТОЛЬКО image_url
    const imageUrl = c.metadata?.image_url as string | undefined

    if (imageUrl) {
      return (
        <div className="relative w-full aspect-square shrink-0">
          <Image
            src={imageUrl}
            alt={getLocalizedField(c, "name", locale) || c.name}
            fill
            sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
            className="object-cover"
          />
        </div>
      )
    }

    return (
      <span className="text-gray-300 font-black text-4xl select-none">
        {(getLocalizedField(c, "name", locale) || c.name).slice(0, 1).toUpperCase()}
      </span>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="content-container py-4 sm:py-6 lg:py-8">
        {/* Breadcrumbs */}
        <nav className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          <LocalizedClientLink href="/" className="hover:text-red-600">
            Home
          </LocalizedClientLink>
          <span className="mx-1 sm:mx-2">/</span>
          <LocalizedClientLink href="/categories" className="hover:text-red-600">
            Каталог
          </LocalizedClientLink>
          {parents.map((parent) => (
            <span key={parent.id}>
              <span className="mx-1 sm:mx-2">/</span>
              <LocalizedClientLink
                href={`/categories/${parent.handle}`}
                className="hover:text-red-600"
                data-testid="sort-by-link"
              >
                {getLocalizedField(parent, "name", locale) || parent.name}
              </LocalizedClientLink>
            </span>
          ))}
          <span className="mx-1 sm:mx-2">/</span>
          <span className="text-gray-900 font-medium">{getLocalizedField(category, "name", locale) || category.name}</span>
        </nav>

        {/* Compact Category Header */}
        <div className="mb-6 lg:mb-10">
          <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-100 group">
            {(() => {
              const categoryImageUrl = category.metadata?.image_url as string | undefined
              const categoryIconUrl = category.metadata?.icon_url as string | undefined
              const displayImageUrl = categoryIconUrl || categoryImageUrl
              
              return displayImageUrl ? (
                <>
                  {/* Ambient Background (Blurred Image) - используем image_url если есть, иначе icon_url */}
                  {categoryImageUrl && (
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={categoryImageUrl}
                        alt=""
                        fill
                        className="object-cover blur-3xl scale-125 opacity-15"
                        aria-hidden="true"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-gray-50/40" />
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col sm:flex-row items-center w-full gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8">
                    {/* Square Image Container */}
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 shrink-0">
                      <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/60 group-hover:ring-white transition-all duration-300">
                        <Image
                          src={displayImageUrl}
                          alt={getLocalizedField(category, "name", locale) || category.name}
                          fill
                          priority
                          sizes="(max-width: 640px) 80px, (max-width: 1024px) 112px, 144px"
                          className={categoryIconUrl ? "object-contain bg-white p-2 transition-transform duration-500 group-hover:scale-105" : "object-contain bg-white p-2 transition-transform duration-500 group-hover:scale-105"}
                        />
                      </div>
                    </div>

                  {/* Text Content */}
                  <div className="flex-1 text-center sm:text-left">
                    <h1 
                      className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 tracking-tight" 
                      data-testid="category-page-title"
                    >
                      {getLocalizedField(category, "name", locale) || category.name}
                    </h1>
                    {(getLocalizedField(category, "description", locale) || category.description) && (
                      <p className="text-gray-500 text-sm sm:text-base max-w-xl leading-relaxed line-clamp-2">
                        {(getLocalizedField(category, "description", locale) || category.description) as string}
                      </p>
                    )}
                  </div>
                </div>
              </>
              ) : null
            })() || (
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <span className="text-lg sm:text-xl">📦</span>
                </div>
                <h1 
                  className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight" 
                  data-testid="category-page-title"
                >
                  {getLocalizedField(category, "name", locale) || category.name}
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Subcategories */}
        {category.category_children && category.category_children.filter((c: any) => !c.is_internal).length > 0 && (
          <div className="mb-8 sm:mb-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {category.category_children.filter((c: any) => !c.is_internal).map((c) => (
                <LocalizedClientLink
                  key={c.id}
                  href={`/categories/${c.handle}`}
                  className="group bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2 sm:gap-3 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="relative w-full aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                    <CategoryMedia c={c} />
                  </div>
                  
                  <div className="px-0.5">
                    <div className="font-semibold text-gray-800 text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-red-600 transition-colors">
                      {getLocalizedField(c, "name", locale) || c.name}
                    </div>
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        )}

        <div
          className="flex flex-col lg:flex-row lg:gap-8"
          data-testid="category-container"
        >
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="sticky top-24">
              <RefinementList sortBy={sort} data-testid="sort-by-container" />
            </div>
          </div>

          {/* Mobile Filter Bar */}
          <div className="lg:hidden mb-4">
            <RefinementList sortBy={sort} data-testid="sort-by-container" />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                categoryId={category.id}
                countryCode={countryCode}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
