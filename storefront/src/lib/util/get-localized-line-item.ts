import { HttpTypes } from "@medusajs/types"
import { getLocalizedField } from "./localization"

type LineItem = HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem

export const getLocalizedLineItemTitle = (item: LineItem, locale: string) => {
  const fallback =
    ((item as any).product_title as string | undefined) ??
    ((item as any).title as string | undefined) ??
    ""

  const product = (item as any)?.variant?.product as
    | HttpTypes.StoreProduct
    | undefined

  if (product) {
    const localized = getLocalizedField(product, "title", locale)
    if (localized) {
      return localized
    }
  }

  return fallback
}












