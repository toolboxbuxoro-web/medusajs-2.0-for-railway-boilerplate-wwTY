import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

// Форматирует цену: убирает тийины (.00, ,00, или " 00") и заменяет запятые на пробелы
function formatPrice(priceString: string): string {
  // Убираем тийины: ,00 или .00 или " 00" (перед валютой или в конце)
  let smoothPrice = priceString.replace(/[.,]00(?=\s|$)/, "")
  smoothPrice = smoothPrice.replace(/\s00(?=\s[A-Z]|$)/, "")
  // Заменяем разделяющие запятые на пробелы (если они остались в середине числа)
  return smoothPrice.replace(/,/g, " ")
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
    <div className="flex flex-col gap-2 mb-6">
      {isOnSale && selectedPrice.original_price && (
        <div className="text-base text-gray-400 line-through decoration-gray-400">
          {formatPrice(selectedPrice.original_price)}
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <span
          className="text-3xl font-extrabold text-red-600 tracking-tight"
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {formatPrice(selectedPrice.calculated_price)}
        </span>
        
        {isOnSale && selectedPrice.percentage_diff && (
          <span className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">
            -{selectedPrice.percentage_diff}%
          </span>
        )}
      </div>

      {isOnSale && discountAmount > 0 && (
        <div className="inline-flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
          Выгода {formatPrice(convertToLocale({ amount: discountAmount, currency_code: selectedPrice.currency_code }))}
        </div>
      )}
    </div>
  )
}

import { convertToLocale } from "@lib/util/money"
