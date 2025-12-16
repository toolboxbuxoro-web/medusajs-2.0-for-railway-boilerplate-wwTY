import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getLocalizedCollectionTitle, getLocalizedProductTitle } from "@lib/util/get-localized-product"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  locale: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  locale,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const productTitle = getLocalizedProductTitle(product, locale)
  const collectionTitle =
    product.collection ? getLocalizedCollectionTitle(product.collection, locale) : null

  return (
    <>
      <div className="bg-white">
        <div className="content-container py-4 sm:py-6 relative" data-testid="product-container">
          {/* Breadcrumbs */}
          <nav className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
            <LocalizedClientLink href="/" className="hover:text-red-600">Home</LocalizedClientLink>
            <span className="mx-1 sm:mx-2">/</span>
            {product.collection && (
              <>
                <LocalizedClientLink href={`/collections/${product.collection.handle}`} className="hover:text-red-600">
                  {collectionTitle}
                </LocalizedClientLink>
                <span className="mx-1 sm:mx-2">/</span>
              </>
            )}
            <span className="text-gray-900">{productTitle}</span>
          </nav>

          {/* 
            Main Product Layout 
            Desktop: Grid (Left: Gallery, Right: Sticky Sidebar)
            Mobile: Stacked
          */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Gallery Column */}
            <div className="lg:col-span-7 w-full overflow-hidden">
              <ImageGallery images={product?.images || []} />
            </div>

            {/* Product Info & Actions Column (Sticky on Desktop) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="sticky top-24 flex flex-col gap-6">
                
                {/* Product Header & Info */}
                <ProductInfo product={product} />

                {/* Purchase Card */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                  <ProductOnboardingCta />
                  <Suspense
                    fallback={
                      <ProductActions
                        disabled={true}
                        product={product}
                        region={region}
                      />
                    }
                  >
                    <ProductActionsWrapper id={product.id} region={region} />
                  </Suspense>
                </div>

                {/* Accordions / Tabs */}
                <div className="pt-2">
                  <ProductTabs product={product} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="content-container py-8 sm:py-12 lg:py-16 bg-gray-50 border-t border-gray-100" data-testid="related-products-container">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
