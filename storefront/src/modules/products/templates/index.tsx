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

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div className="bg-white">
        <div className="content-container py-4 sm:py-6">
          {/* Breadcrumbs */}
          <nav className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
            <LocalizedClientLink href="/" className="hover:text-red-600">Home</LocalizedClientLink>
            <span className="mx-1 sm:mx-2">/</span>
            {product.collection && (
              <>
                <LocalizedClientLink href={`/collections/${product.collection.handle}`} className="hover:text-red-600">
                  {product.collection.title}
                </LocalizedClientLink>
                <span className="mx-1 sm:mx-2">/</span>
              </>
            )}
            <span className="text-gray-900">{product.title}</span>
          </nav>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="space-y-4 sm:space-y-6">
              {/* Image Gallery */}
              <ImageGallery images={product?.images || []} />
              
              {/* Product Info */}
              <ProductInfo product={product} />
              
              {/* Purchase Actions */}
              <div className="bg-gray-50 rounded-xl p-4">
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
          </div>

          {/* Desktop Layout */}
          <div
            className="hidden lg:grid lg:grid-cols-12 gap-6 xl:gap-8"
            data-testid="product-container"
          >
            {/* Left: Image Gallery */}
            <div className="lg:col-span-5 xl:col-span-5">
              <div className="sticky top-24">
                <ImageGallery images={product?.images || []} />
              </div>
            </div>

            {/* Center: Product Info */}
            <div className="lg:col-span-4 xl:col-span-4">
              <ProductInfo product={product} />
              <div className="mt-6">
                <ProductTabs product={product} />
              </div>
            </div>

            {/* Right: Purchase Section */}
            <div className="lg:col-span-3 xl:col-span-3">
              <div className="sticky top-24">
                <div className="bg-gray-50 rounded-xl p-4 xl:p-6">
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
      <div className="content-container py-8 sm:py-12 lg:py-16" data-testid="related-products-container">
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
