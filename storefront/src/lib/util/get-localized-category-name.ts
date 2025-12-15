import { HttpTypes } from "@medusajs/types"

export const getLocalizedCategoryName = (
  category: HttpTypes.StoreProductCategory,
  locale: string
) => {
  if (locale === "uz" && category.metadata?.name_uz) {
    return category.metadata.name_uz as string
  }
  return category.name
}

export const getLocalizedCategoryDescription = (
  category: HttpTypes.StoreProductCategory,
  locale: string
) => {
  if (locale === "uz" && category.metadata?.description_uz) {
    return category.metadata.description_uz as string
  }
  return category.description
}
