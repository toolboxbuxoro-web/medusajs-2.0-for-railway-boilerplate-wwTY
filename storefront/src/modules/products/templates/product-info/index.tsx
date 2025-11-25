import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Heart from "@modules/common/icons/heart"
import Compare from "@modules/common/icons/compare"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const rating = 4.5
  const reviewCount = 18

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-3 sm:gap-y-4">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-2">
          {product.metadata?.black_friday && (
            <span className="inline-block bg-black text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded font-semibold">
              BLACK FRIDAY
            </span>
          )}
          <span className="inline-block bg-blue-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded">
            Easy Return
          </span>
        </div>

        {/* Title */}
        <Heading
          level="h1"
          className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        {/* Product Code & Rating */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span>Code: {product.metadata?.code || product.id.slice(0, 8)}</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < Math.floor(rating) ? 'text-red-600' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="font-semibold">{rating}</span>
            <span>({reviewCount} reviews)</span>
          </div>
        </div>

        {/* Warranty & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-2 sm:mt-4">
          <span className="text-xs sm:text-sm text-gray-600">Warranty: 1 year</span>
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-red-600 transition-colors">
              <Heart size="18" />
              <span className="hidden sm:inline">Favorites</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-red-600 transition-colors">
              <Compare size="18" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <Text
            className="text-sm sm:text-base text-gray-700 whitespace-pre-line mt-2 sm:mt-4 line-clamp-3 sm:line-clamp-none"
            data-testid="product-description"
          >
            {product.description}
          </Text>
        )}
      </div>
    </div>
  )
}

export default ProductInfo
