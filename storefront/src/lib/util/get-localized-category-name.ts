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
