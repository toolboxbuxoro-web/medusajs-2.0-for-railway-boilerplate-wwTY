"use client"

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

import ReviewsSection from "@modules/products/components/reviews"
import MobileProductHeader from "@modules/products/components/mobile-product-header"
import { useEffect } from "react"

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
  if (!product || !product.id || product.id === "undefined" || product.id === "null") {
    console.warn("[ProductTemplate] Missing or invalid product.id. Redirecting to notFound.", {
      id: product?.id,
      handle: product?.handle,
    })
    return notFound()
  }

  // Debug log to verify if it's a product ID or variant ID
  if (product.id && !product.id.startsWith("prod_")) {
    console.warn("[ProductTemplate] product.id does not start with 'prod_'. This might be a variant ID!", product.id)
  }

  const t = useTranslations('product')
  const tNav = useTranslations('nav')
  const tHero = useTranslations('hero')
  const productTitle = getLocalizedField(product, "title", locale) || product.title
  const collectionTitle =
    product.collection ? (getLocalizedField(product.collection, "title", locale) || product.collection.title) : null

  // Ensure the product page uses the same "main" image as lists/cards:
  // put the thumbnail first (if present) and then the rest of the gallery images,
  // while avoiding duplicate URLs.
  const galleryImages =
    product.thumbnail
      ? ([
          { id: "thumbnail", url: product.thumbnail } as any,
          ...(product.images || []),
        ].filter(
          (img, index, self) =>
            !!img?.url &&
            self.findIndex((other) => other?.url === img.url) === index
        ) as HttpTypes.StoreProductImage[])
      : (product.images || [])

  useEffect(() => {
    // Add class to body on mobile to hide global header
    const updateMobileClass = () => {
      const isMobile = window.innerWidth < 1024
      if (isMobile) {
        document.body.classList.add("product-page-mobile")
      } else {
        document.body.classList.remove("product-page-mobile")
      }
    }

    // Initial check
    updateMobileClass()

    // Update on resize
    window.addEventListener('resize', updateMobileClass)

    return () => {
      document.body.classList.remove("product-page-mobile")
      window.removeEventListener('resize', updateMobileClass)
    }
  }, [])

  return (
    <>
      {/* Mobile Product Header - Fixed, outside content-container */}
      <div className="lg:hidden">
        <MobileProductHeader product={product} />
      </div>

      <div className="bg-white min-h-screen">
        <div className="content-container py-4 sm:py-6" data-testid="product-container">
          {/* Breadcrumbs - Desktop only (hidden on mobile with custom header) */}
            <nav className="hidden lg:block text-xs sm:text-sm text-gray-500 mb-4 sm:mb-8 overflow-x-auto no-scrollbar whitespace-nowrap">
                <LocalizedClientLink href="/" className="hover:text-red-600 transition-colors">
                  {tNav('home')}
                </LocalizedClientLink>
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
            {/* Add top padding to account for fixed header */}
            <div className="pt-14"></div>
            <div className="space-y-6">
              {/* Uzum Mobile: Gallery - Full Width */}
              <div className="-mx-4 sm:-mx-6">
                <ImageGallery images={galleryImages} />
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
                  
                  {/* Reviews on mobile - full width */}
                  {product?.id && (
                    <ReviewsSection 
                      productId={product.id} 
                      locale={locale} 
                    />
                  )}
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
              <div className="bg-white rounded-3xl overflow-hidden space-y-4">
                <ImageGallery images={galleryImages} />
                <div className="px-6 pb-2">
                   <ProductInfo product={product} variant="compact" />
                </div>
              </div>

              {/* Detailed Technical Specs & Description below the images */}
              <div className="pt-8 border-t border-gray-100">
                <div className="max-w-4xl">
                  <ProductInfo product={product} variant="details" />
                  <div className="mt-12">
                     <ProductTabs product={product} />
                  </div>
                  
                  {/* Reviews on desktop - constrained width */}
                  <div className="mt-12">
                    {product?.id && (
                      <ReviewsSection 
                        productId={product.id} 
                        locale={locale} 
                      />
                    )}
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
