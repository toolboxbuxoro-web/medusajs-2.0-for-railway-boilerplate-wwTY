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

export default function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

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
      <Text
        className={clx(
          "text-lg sm:text-xl font-bold",
          {
            "text-red-600": price.price_type === "sale",
            "text-gray-900": price.price_type !== "sale",
          }
        )}
        data-testid="price"
      >
        {formatPrice(price.calculated_price)}
      </Text>
      {price.price_type === "sale" && (
        <span className="text-xs font-semibold text-white bg-red-600 px-2 py-0.5 rounded-full">
          СКИДКА
        </span>
      )}
    </div>
  )
}
