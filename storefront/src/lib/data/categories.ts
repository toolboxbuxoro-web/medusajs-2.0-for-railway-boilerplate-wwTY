import { sdk } from "@lib/config"
import { cache } from "react"

export const listCategories = cache(async function () {
  return sdk.store.category
    .list(
      { fields: "+category_children" },
      { next: { tags: ["categories"], revalidate: 60 } }
    )
    .then(({ product_categories }) => product_categories)
})

export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
) {
  return sdk.store.category.list(
    // @ts-ignore
    { limit, offset, fields: "+category_children" },
    { next: { tags: ["categories"], revalidate: 60 } }
  )
})

export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
) {
  try {
    return await sdk.store.category.list(
      // TODO: Look into fixing the type
      // @ts-ignore
      { handle: categoryHandle, fields: "+category_children" },
      { next: { tags: ["categories"], revalidate: 60 } }
    )
  } catch (error) {
    console.error("Error fetching category by handle:", categoryHandle, error)
    return { product_categories: [] }
  }
})
