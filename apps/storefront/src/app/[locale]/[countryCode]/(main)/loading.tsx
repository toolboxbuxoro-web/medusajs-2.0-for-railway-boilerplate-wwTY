import SkeletonHero from "@modules/skeletons/components/skeleton-hero"
import SkeletonCategories from "@modules/skeletons/components/skeleton-categories"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export default function Loading() {
  return (
    <>
      <div className="content-container px-4 md:px-6 pt-6 sm:pt-8">
        <SkeletonHero />
      </div>

      <SkeletonCategories />
      
      <div className="bg-white py-12 sm:py-16 lg:py-24">
        <div className="content-container">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="w-48 h-8 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col gap-y-12">
            <SkeletonProductGrid />
          </div>
        </div>
      </div>
    </>
  )
}
