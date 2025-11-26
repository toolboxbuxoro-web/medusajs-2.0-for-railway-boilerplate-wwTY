import { Suspense } from "react"
import { getTranslations } from 'next-intl/server'

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const t = await getTranslations('store')

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="content-container py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="heading-2" data-testid="store-page-title">
            {t('all_products')}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">
            {t('browse_collection')}
          </p>
        </div>

        <div
          className="flex flex-col lg:flex-row lg:gap-8"
          data-testid="category-container"
        >
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
            <div className="sticky top-24">
              <RefinementList sortBy={sort} />
            </div>
          </div>

          {/* Mobile Filter Bar */}
          <div className="lg:hidden mb-4">
            <RefinementList sortBy={sort} />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={countryCode}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
