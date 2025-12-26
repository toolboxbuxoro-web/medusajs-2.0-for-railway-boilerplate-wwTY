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
import { getLocalizedField } from "@lib/util/localization"
import { useTranslations } from "next-intl"

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

  const t = useTranslations('product')
  const productTitle = getLocalizedField(product, "title", locale) || product.title
  const collectionTitle =
    product.collection ? (getLocalizedField(product.collection, "title", locale) || product.collection.title) : null

  return (
    <>
      <div className="bg-white min-h-screen">
        <div className="content-container py-4 sm:py-6" data-testid="product-container">
          {/* Breadcrumbs - Desktop & Mobile */}
          <nav className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
                <LocalizedClientLink href="/" className="hover:text-red-600 transition-colors">Главная</LocalizedClientLink>
                <span className="mx-2 opacity-30">/</span>
                {product.collection && (
                  <>
                    <LocalizedClientLink href={`/collections/${product.collection.handle}`} className="hover:text-red-600 transition-colors">
                      {collectionTitle}
                    </LocalizedClientLink>
                <span className="mx-2 opacity-30">/</span>
              </>
            )}
            <span className="text-gray-400">{productTitle}</span>
          </nav>

          {/* Mobile Layout */}
          <div className="lg:hidden">
            <div className="space-y-6">
              {/* Uzum Mobile: Gallery - Full Width */}
              <div className="-mx-4 sm:-mx-6">
                <ImageGallery images={product?.images || []} />
              </div>
              
              <div className="space-y-8">
                <ProductInfo product={product} />
                
                {/* Purchase Actions (Mobile Card) */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
                    <ProductActionsWrapper product={product} region={region} />
                  </Suspense>
                </div>

                {/* Tabs below specs on mobile */}
                <div className="pb-16">
                  <ProductTabs product={product} />
                </div>
              </div>
            </div>
          </div>

          {/* Product Header (Uzum style: Brand, Title, Rating) - FULL WIDTH ABOVE GRID */}
          <div className="hidden lg:block mb-8">
             <ProductInfo product={product} variant="header" />
          </div>

          {/* Desktop Layout: Uzum-style Sidebar Grid */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-8 xl:gap-12 items-start">
            
            {/* Left/Center Column: Image Gallery & Detailed Specs (9/12) */}
            <div className="lg:col-span-9 space-y-12">
              <div className="bg-white rounded-3xl overflow-hidden">
                <ImageGallery images={product?.images || []} />
              </div>

              {/* Detailed Technical Specs & Description below the images */}
              <div className="pt-8 border-t border-gray-100">
                <div className="max-w-4xl">
                  <ProductInfo product={product} variant="details" />
                  <div className="mt-12">
                     <ProductTabs product={product} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Purchase Sidebar (3/12) */}
            <div className="lg:col-span-3">
              <div className="sticky top-28 space-y-6">
                <div className="bg-white rounded-3xl p-6 xl:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-900/5">
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
                    <ProductActionsWrapper product={product} region={region} />
                  </Suspense>
                  
                  {/* Delivery & Security Info (Uzum style) */}
                  <div className="mt-6 pt-6 border-t border-gray-50 space-y-4">
                    <div className="flex items-start gap-3">
                       <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       </div>
                       <div>
                          <p className="text-sm font-medium text-gray-900">Бесплатная доставка</p>
                          <p className="text-xs text-gray-500 mt-0.5">В пункты выдачи или курьером</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="bg-gray-50/50 border-t border-gray-100">
        <div className="content-container py-12 sm:py-16 lg:py-20" data-testid="related-products-container">
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    </>
  )
}

export default ProductTemplate
