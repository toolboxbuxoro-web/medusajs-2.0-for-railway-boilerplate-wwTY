import { clx } from "@medusajs/ui"

import { getPercentageDiff } from "@lib/util/get-precentage-diff"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

// Форматирует цену: убирает .00 и заменяет запятые на пробелы
function formatPrice(priceString: string): string {
  return priceString.replace(/\.00$/, "").replace(/,/g, " ")
}

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode?: string
}

const LineItemPrice = ({ item, style = "default", currencyCode: customCurrencyCode }: LineItemPriceProps) => {
  const prices = getPricesForVariant(item.variant) ?? {
    currency_code: customCurrencyCode || "UZS",
    calculated_price_number: 0,
    original_price_number: 0
  }
  const currency_code = customCurrencyCode || prices.currency_code
  const { calculated_price_number, original_price_number } = prices

  const adjustmentsSum = (item.adjustments || []).reduce(
    (acc, adjustment) => adjustment.amount + acc,
    0
  )

  const originalPrice = original_price_number * item.quantity
  const currentPrice = calculated_price_number * item.quantity - adjustmentsSum
  const hasReducedPrice = currentPrice < originalPrice

  return (
    <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
      <div className="text-left">
        {hasReducedPrice && (
          <>
            <p>
              {style === "default" && (
                <span className="text-ui-fg-subtle">Original: </span>
              )}
              <span
                className="line-through text-ui-fg-muted"
                data-testid="product-original-price"
              >
                {formatPrice(convertToLocale({
                  amount: originalPrice,
                  currency_code,
                }))}
              </span>
            </p>
            {style === "default" && (
              <span className="text-ui-fg-interactive">
                -{getPercentageDiff(originalPrice, currentPrice || 0)}%
              </span>
            )}
          </>
        )}
        <span
          className={clx("text-base-regular", {
            "text-ui-fg-interactive": hasReducedPrice,
          })}
          data-testid="product-price"
        >
          {formatPrice(convertToLocale({
            amount: currentPrice,
            currency_code,
          }))}
        </span>
      </div>
    </div>
  )
}

export default LineItemPrice
