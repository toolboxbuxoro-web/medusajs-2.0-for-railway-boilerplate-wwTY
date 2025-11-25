import { Text } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const [pricedProduct] = await getProductsById({
    ids: [product.id!],
    regionId: region.id,
  })

  if (!pricedProduct) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
  })

  return (
    <LocalizedClientLink 
      href={`/products/${product.handle}`} 
      className="group block h-full"
    >
      <div 
        data-testid="product-wrapper"
        className="bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:border-red-200 hover:-translate-y-1"
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
          
          {/* Badge - if on sale */}
          {cheapestPrice?.price_type === "sale" && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              SALE
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col">
          {/* Title */}
          <Text 
            className="text-gray-900 text-sm sm:text-base font-semibold line-clamp-2 mb-2 group-hover:text-red-600 transition-colors min-h-[2.5rem] sm:min-h-[3rem]" 
            data-testid="product-title"
          >
            {product.title}
          </Text>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Price */}
          <div className="mt-2">
            {cheapestPrice && (
              <div className="flex items-baseline gap-2">
                <PreviewPrice price={cheapestPrice} />
              </div>
            )}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
