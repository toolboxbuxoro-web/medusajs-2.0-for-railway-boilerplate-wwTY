import { HttpTypes } from "@medusajs/types"
import { getProductsList } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function RecommendedProducts({
  countryCode,
  region,
  currentProductIds = [],
}: {
  countryCode: string
  region: HttpTypes.StoreRegion
  currentProductIds?: string[]
}) {
  const { response } = await getProductsList({
    countryCode,
    queryParams: { limit: 2 },
  })

  const products = response.products
    ?.filter((p) => !currentProductIds.includes(p.id))
    .slice(0, 2) || []

  if (products.length === 0) {
    return null
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recommended</h3>
        <button className="text-sm text-gray-600 hover:text-gray-900">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product.id} className="relative">
            <ProductPreview product={product} region={region} />
          </div>
        ))}
      </div>
    </div>
  )
}

