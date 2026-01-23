import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { getLocalizedField } from "@lib/util/localization"
import CollectionBanner from "../components/collection-banner"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  locale,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  locale: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const localeStr = locale

    const metadata = collection.metadata as Record<string, any> | undefined
    const isColored = Boolean(metadata?.colored_background)
    const bgColor = (metadata?.background_color as string) || "#ffffff"
    const textColor = (metadata?.text_color as string) || "#111827"

    return (
        <div 
          className="w-full"
          style={isColored ? { backgroundColor: bgColor, color: textColor, minHeight: '100vh' } : undefined}
        >
          <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
            <RefinementList sortBy={sort} />
            <div className="w-full">
              {/* Collection Banner */}
              <CollectionBanner collection={collection} locale={localeStr} />
              
              <div className="mb-8 text-2xl-semi">
                <h1 style={isColored ? { color: textColor } : undefined}>
                  {getLocalizedField(collection, "title", localeStr)}
                </h1>
              </div>
              <Suspense fallback={<SkeletonProductGrid />}>
                <PaginatedProducts
                  sortBy={sort}
                  page={pageNumber}
                  collectionId={collection.id}
                  countryCode={countryCode}
                />
              </Suspense>
            </div>
          </div>
        </div>
    )
}
