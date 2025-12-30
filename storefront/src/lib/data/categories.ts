import { sdk } from "@lib/config"
import { cache } from "react"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

// Helper function to fetch categories with metadata using direct HTTP
async function fetchCategoriesWithMetadata(params: Record<string, any> = {}) {
  const queryParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => queryParams.append(key, v))
    } else if (value !== undefined && value !== null) {
      queryParams.append(key, String(value))
    }
  })

  const url = `${BACKEND_URL}/store/product-categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  
  console.log('[Categories] Fetching from:', url)
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // @ts-ignore - Next.js specific fetch options
    next: { tags: ["categories"], revalidate: 60 }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`)
  }

  const data = await response.json()
  console.log('[Categories] Response:', { 
    count: data.product_categories?.length,
    hasMetadata: data.product_categories?.[0]?.metadata ? 'yes' : 'no'
  })
  
  return data
}

export const listCategories = cache(async function () {
  try {
    const { product_categories } = await fetchCategoriesWithMetadata()
    return product_categories
  } catch (error) {
    console.error('[Categories] Error in listCategories:', error)
    // Fallback to SDK if custom endpoint fails
    return sdk.store.category
      .list(
        { fields: "+category_children,+is_internal,+metadata" },
        // @ts-ignore - Next.js specific fetch options
        { next: { tags: ["categories"], revalidate: 60 } }
      )
      .then(({ product_categories }) => product_categories)
  }
})

export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
) {
  try {
    return await fetchCategoriesWithMetadata({ limit, offset })
  } catch (error) {
    console.error('[Categories] Error in getCategoriesList:', error)
    // Fallback to SDK
    return sdk.store.category.list(
      // @ts-ignore
      { limit, offset, fields: "+category_children,+metadata" },
      // @ts-ignore - Next.js specific fetch options
      { next: { tags: ["categories"], revalidate: 60 } }
    )
  }
})

export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
) {
  try {
    return await fetchCategoriesWithMetadata({ handle: categoryHandle })
  } catch (error: any) {
    console.error("[Categories] Error fetching category by handle:", categoryHandle, error?.message)
    // Fallback to SDK
    try {
      return await sdk.store.category.list(
        // @ts-ignore
        { handle: categoryHandle, fields: "+category_children,+metadata" },
        // @ts-ignore - Next.js specific fetch options
        { next: { tags: ["categories"], revalidate: 60 } }
      )
    } catch (sdkError) {
      return { product_categories: [] }
    }
  }
})
