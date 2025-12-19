import { HttpTypes } from "@medusajs/types"
import { getLocalizedProductTitle } from "./get-localized-product"

type LineItem = HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem

export const getLocalizedLineItemTitle = (item: LineItem, locale: string) => {
  const fallback =
    ((item as any).product_title as string | undefined) ??
    ((item as any).title as string | undefined) ??
    ""

  if (locale !== "uz") {
    return fallback
  }

  const product = (item as any)?.variant?.product as
    | HttpTypes.StoreProduct
    | undefined

  if (product) {
    return getLocalizedProductTitle(product, locale)
  }

  return fallback
}




