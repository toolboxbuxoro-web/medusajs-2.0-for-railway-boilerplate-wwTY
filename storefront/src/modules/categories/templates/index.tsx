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
import { getLocalizedCategoryDescription, getLocalizedCategoryName } from "@lib/util/get-localized-category-name"

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
    const imageUrl = c.metadata?.image_url as string | undefined
    const iconUrl = c.metadata?.icon_url as string | undefined

    if (imageUrl) {
      return (
        <div className="relative w-full h-full shrink-0">
          <Image
            src={imageUrl}
            alt={getLocalizedCategoryName(c, locale)}
            fill
            sizes="(max-width: 640px) 64px, (max-width: 1024px) 80px, 120px"
            className="object-cover"
          />
        </div>
      )
    }
    if (iconUrl) {
      return (
        <div className="relative w-10 h-10 shrink-0">
          <Image
            src={iconUrl}
            alt=""
            fill
            sizes="40px"
            className="object-contain"
          />
        </div>
      )
    }

    return (
      <span className="text-gray-400 font-bold text-lg">
        {getLocalizedCategoryName(c, locale).slice(0, 1).toUpperCase()}
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
                {getLocalizedCategoryName(parent, locale)}
              </LocalizedClientLink>
            </span>
          ))}
          <span className="mx-1 sm:mx-2">/</span>
          <span className="text-gray-900 font-medium">{getLocalizedCategoryName(category, locale)}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-10">
            {typeof category.metadata?.image_url === "string" && (
              <div className="relative w-full md:w-72 lg:w-96 h-48 md:h-52 lg:h-64 rounded-[2rem] overflow-hidden border border-gray-200 bg-white shadow-md flex-shrink-0 group">
                <Image
                  src={category.metadata.image_url as string}
                  alt={getLocalizedCategoryName(category, locale)}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 288px, 384px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight" data-testid="category-page-title">
                {getLocalizedCategoryName(category, locale)}
              </h1>
              {getLocalizedCategoryDescription(category, locale) && (
                <p className="text-gray-600 text-base sm:text-lg max-w-3xl leading-relaxed font-normal">
                  {getLocalizedCategoryDescription(category, locale) as string}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Subcategories */}
        {category.category_children && category.category_children.filter((c: any) => !c.is_internal).length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {category.category_children.filter((c: any) => !c.is_internal).map((c) => (
                <LocalizedClientLink
                  key={c.id}
                  href={`/categories/${c.handle}`}
                  className="group bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2">
                      {getLocalizedCategoryName(c, locale)}
                    </div>
                  </div>

                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <CategoryMedia c={c} />
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
