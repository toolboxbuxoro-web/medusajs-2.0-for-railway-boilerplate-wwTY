import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

// Форматирует цену: убирает .00 и заменяет запятые на пробелы
function formatPrice(priceString: string): string {
  return priceString.replace(/\.00$/, "").replace(/,/g, " ")
}

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const isOnSale = selectedPrice.price_type === "sale"
  const discountAmount = isOnSale && selectedPrice.original_price_number
    ? selectedPrice.original_price_number - selectedPrice.calculated_price_number
    : 0

  return (
    <div className="flex flex-col gap-2 mb-4">
      {isOnSale && selectedPrice.original_price && (
        <div className="text-lg text-gray-500 line-through">
          {formatPrice(selectedPrice.original_price)}
        </div>
      )}
      {isOnSale && discountAmount > 0 && (
        <div className="inline-block bg-black text-white px-3 py-1 rounded text-sm font-semibold w-fit">
          Benefit {formatPrice(selectedPrice.original_price || '').replace(formatPrice(selectedPrice.calculated_price || ''), '').trim() || `${Math.round(discountAmount / 100)} P`}
        </div>
      )}
      <div className="flex items-baseline gap-2">
        <span
          className={clx("text-3xl font-bold text-red-600", {
            "text-red-600": isOnSale,
          })}
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {formatPrice(selectedPrice.calculated_price)}
        </span>
      </div>
      {isOnSale && selectedPrice.percentage_diff && (
        <span className="text-sm text-green-600 font-semibold">
            -{selectedPrice.percentage_diff}%
          </span>
      )}
    </div>
  )
}
