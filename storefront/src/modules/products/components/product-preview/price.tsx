import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

// Форматирует цену: убирает тийины (.00, ,00, или " 00") и заменяет запятые на пробелы
function formatPrice(priceString: string): string {
  // Убираем тийины: ,00 или .00 или " 00" (перед валютой или в конце)
  let smoothPrice = priceString.replace(/[.,]00(?=\s|$)/, "")
  smoothPrice = smoothPrice.replace(/\s00(?=\s[A-Z]|$)/, "")
  // Заменяем разделяющие запятые на пробелы (если они остались в середине числа)
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

  // Price is red if: isRed prop is true OR it's a sale price
  const showRedPrice = isRed || price.price_type === "sale"

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      {price.price_type === "sale" && (
        <Text
          className="text-sm sm:text-base text-gray-400 line-through font-medium"
          data-testid="original-price"
        >
          {formatPrice(price.original_price)}
        </Text>
      )}
      <span
        className={clx(
          "text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums",
          {
            "text-red-600": showRedPrice,
            "text-gray-900": !showRedPrice,
          }
        )}
        style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        data-testid="price"
      >
        {formatPrice(price.calculated_price)}
      </span>
      {price.price_type === "sale" && (
        <span className="text-xs font-semibold text-white bg-red-600 px-2 py-0.5 rounded-full">
          СКИДКА
        </span>
      )}
    </div>
  )
}

