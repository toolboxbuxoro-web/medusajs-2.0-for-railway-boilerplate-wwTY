import { HttpTypes } from "@medusajs/types"

export const getLocalizedProductTitle = (
  product: HttpTypes.StoreProduct,
  locale: string
) => {
  if (locale === "uz" && product.metadata?.title_uz) {
    return product.metadata.title_uz as string
  }
  return product.title
}

export const getLocalizedProductDescription = (
  product: HttpTypes.StoreProduct,
  locale: string
) => {
  if (locale === "uz" && product.metadata?.description_uz) {
    return product.metadata.description_uz as string
  }
  return product.description
}

export const getLocalizedCollectionTitle = (
  collection: HttpTypes.StoreCollection,
  locale: string
) => {
  if (locale === "uz" && collection.metadata?.title_uz) {
    return collection.metadata.title_uz as string
  }
  return collection.title
}





