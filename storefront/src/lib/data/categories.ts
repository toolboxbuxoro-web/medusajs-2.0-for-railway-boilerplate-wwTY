import { sdk } from "@lib/config"
import { cache } from "react"

export const listCategories = cache(async function () {
  return sdk.store.category
    .list(
      { fields: "+category_children,+is_internal" },
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
  console.log('[Categories] getCategoryByHandle called with:', categoryHandle)
  
  try {
    const result = await sdk.store.category.list(
      // TODO: Look into fixing the type
      // @ts-ignore
      { handle: categoryHandle, fields: "+category_children" },
      { next: { tags: ["categories"], revalidate: 60 } }
    )
    
    console.log('[Categories] getCategoryByHandle result:', {
      handle: categoryHandle,
      foundCount: result?.product_categories?.length || 0,
      categories: result?.product_categories?.map((c: any) => ({ id: c.id, handle: c.handle, name: c.name }))
    })
    
    return result
  } catch (error: any) {
    console.error("[Categories] Error fetching category by handle:", {
      handle: categoryHandle,
      error: error?.message || error
    })
    return { product_categories: [] }
  }
})
