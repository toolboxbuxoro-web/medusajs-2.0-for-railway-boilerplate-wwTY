import { notFound } from "next/navigation"
import { Suspense } from "react"

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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="content-container py-4 sm:py-6 lg:py-8">
        {/* Breadcrumbs */}
        <nav className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          <LocalizedClientLink href="/" className="hover:text-red-600">
            Home
          </LocalizedClientLink>
          <span className="mx-1 sm:mx-2">/</span>
          <LocalizedClientLink href="/store" className="hover:text-red-600">
            Store
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
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            {category.metadata?.image_url && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                <img
                  src={category.metadata.image_url as string}
                  alt={getLocalizedCategoryName(category, locale)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h1 className="heading-2" data-testid="category-page-title">
              {getLocalizedCategoryName(category, locale)}
            </h1>
          </div>
          {getLocalizedCategoryDescription(category, locale) && (
            <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-2xl">
              {getLocalizedCategoryDescription(category, locale)}
            </p>
          )}
        </div>

        {/* Subcategories */}
        {category.category_children && category.category_children.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {category.category_children.map((c) => (
                <LocalizedClientLink
                  key={c.id}
                  href={`/categories/${c.handle}`}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white border border-gray-200 rounded-full text-xs sm:text-sm font-medium hover:border-red-600 hover:text-red-600 transition-colors"
                >
                  {getLocalizedCategoryName(c, locale)}
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
