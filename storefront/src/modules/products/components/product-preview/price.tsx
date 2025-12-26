import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

// Форматирует цену: убирает тийины (.00, ,00, или " 00") и заменяет запятые на пробелы
function formatPrice(priceString: string): string {
  let smoothPrice = priceString.replace(/[.,]00(?=\s|$)/, "")
  smoothPrice = smoothPrice.replace(/\s00(?=\s[A-Z]|$)/, "")
  return smoothPrice.replace(/,/g, " ")
}

export default function PreviewPrice({ 
  price, 
  isRed = false 
}: { 
  price: VariantPrice
  isRed?: boolean 
}) {
  if (!price) {
    return null
  }

  const showRedPrice = isRed || price.price_type === "sale"
  const formattedPrice = formatPrice(price.calculated_price)
  
  // Calculate adaptive font size based on price length
  const priceLength = formattedPrice.length
  let fontSizeClass = "text-lg sm:text-xl"
  if (priceLength > 12) {
    fontSizeClass = "text-sm sm:text-base"
  } else if (priceLength > 9) {
    fontSizeClass = "text-base sm:text-lg"
  }

  return (
    <div className="flex items-baseline gap-1.5 flex-wrap">
      {price.price_type === "sale" && (
        <span className="text-xs text-gray-400 line-through font-medium truncate max-w-[80px]">
          {formatPrice(price.original_price)}
        </span>
      )}
      <span
        className={clx(
          fontSizeClass,
          "font-bold tracking-tight tabular-nums whitespace-nowrap",
          {
            "text-red-600": showRedPrice,
            "text-gray-900": !showRedPrice,
          }
        )}
        data-testid="price"
      >
        {formattedPrice}
      </span>
      {price.price_type === "sale" && price.percentage_diff && (
        <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
          -{price.percentage_diff}%
        </span>
      )}
    </div>
  )
}
