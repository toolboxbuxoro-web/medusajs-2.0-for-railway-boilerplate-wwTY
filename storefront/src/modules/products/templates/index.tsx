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
      <div className="bg-white min-h-screen">
        <div className="content-container py-4 sm:py-6" data-testid="product-container">
          {/* Breadcrumbs */}
          <nav className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
            <LocalizedClientLink href="/" className="hover:text-red-600 transition-colors">Главная</LocalizedClientLink>
            <span className="mx-1.5">/</span>
            {product.collection && (
              <>
                <LocalizedClientLink href={`/collections/${product.collection.handle}`} className="hover:text-red-600 transition-colors">
                  {collectionTitle}
                </LocalizedClientLink>
                <span className="mx-1.5">/</span>
              </>
            )}
            <span className="text-gray-900">{productTitle}</span>
          </nav>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={product?.images || []} />
            
            {/* Product Info */}
            <ProductInfo product={product} />
            
            {/* Purchase Actions */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
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

            {/* Product Tabs */}
            <ProductTabs product={product} />
          </div>

          {/* Desktop Layout: 3-Column Grid */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-6 xl:gap-8">
            {/* Column 1: Image Gallery (5 cols) */}
            <div className="lg:col-span-5">
              <ImageGallery images={product?.images || []} />
            </div>

            {/* Column 2: Product Info & Specs (4 cols) */}
            <div className="lg:col-span-4">
              <ProductInfo product={product} />
              
              {/* Tabs below specs on desktop */}
              <div className="mt-6">
                <ProductTabs product={product} />
              </div>
            </div>

            {/* Column 3: Purchase Card (3 cols) - Sticky */}
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <div className="bg-gray-50 rounded-xl p-4 xl:p-5 border border-gray-100 shadow-sm">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="content-container py-8 sm:py-12 lg:py-16" data-testid="related-products-container">
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    </>
  )
}

export default ProductTemplate
