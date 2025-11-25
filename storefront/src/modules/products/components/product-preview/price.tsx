import { Text, clx } from "@medusajs/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
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
          {price.original_price}
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
        {price.calculated_price}
      </Text>
      {price.price_type === "sale" && (
        <span className="text-xs font-semibold text-white bg-red-600 px-2 py-0.5 rounded-full">
          СКИДКА
        </span>
      )}
    </div>
  )
}
