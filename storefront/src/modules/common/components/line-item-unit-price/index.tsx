import { getPricesForVariant } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

// Форматирует цену: убирает .00 и заменяет запятые на пробелы
function formatPrice(priceString: string | undefined): string {
  if (!priceString) return ""
  return priceString.replace(/\.00$/, "").replace(/,/g, " ")
}

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode?: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode: customCurrencyCode
}: LineItemUnitPriceProps) => {
  const prices = getPricesForVariant(item.variant) ?? {
    original_price: "",
    calculated_price: "",
    original_price_number: 0,
    calculated_price_number: 0,
    percentage_diff: 0,
    currency_code: customCurrencyCode
  }
  
  const {
    original_price,
    calculated_price,
    original_price_number,
    calculated_price_number,
    percentage_diff,
  } = prices
  const hasReducedPrice = calculated_price_number < original_price_number

  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      {hasReducedPrice && (
        <>
          <p>
            {style === "default" && (
              <span className="text-ui-fg-muted">Original: </span>
            )}
            <span
              className="line-through"
              data-testid="product-unit-original-price"
            >
              {formatPrice(original_price)}
            </span>
          </p>
          {style === "default" && (
            <span className="text-ui-fg-interactive">-{percentage_diff}%</span>
          )}
        </>
      )}
      <span
        className={clx("text-base-regular", {
          "text-ui-fg-interactive": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        {formatPrice(calculated_price)}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
