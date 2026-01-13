import { sdk } from "@lib/config"
import { cache } from "react"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

// Cached fetch of ALL categories (single source of truth)
async function fetchAllCategories() {
  const url = `${BACKEND_URL}/store/product-categories?limit=500`
  
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

  return await response.json()
}

// Main cached function to get all categories
export const getCategoriesList = cache(async function (
  offset: number = 0,
  limit: number = 100
) {
  try {
    const data = await fetchAllCategories()
    // Apply offset/limit locally if needed
    const sliced = data.product_categories?.slice(offset, offset + limit) || []
    return {
      product_categories: sliced,
      count: data.product_categories?.length || 0,
      offset,
      limit
    }
  } catch (error) {
    console.error('[Categories] Error in getCategoriesList:', error)
    // Fallback to SDK
    try {
      const response = await sdk.store.category.list(
        // @ts-ignore
        { limit, offset, fields: "+category_children,+metadata" },
        // @ts-ignore - Next.js specific fetch options
        { next: { tags: ["categories"], revalidate: 60 } }
      )
      return response
    } catch (sdkError) {
      console.error('[Categories] SDK fallback failed:', sdkError)
      return { product_categories: [], count: 0, offset, limit }
    }
  }
})

// Alias for backward compatibility
export const listCategories = cache(async function () {
  const { product_categories } = await getCategoriesList(0, 500)
  return product_categories || []
})

/**
 * Get category by handle using LOCAL LOOKUP (Uzum/WB approach)
 * Does NOT make a separate backend request with ?handle= (which Medusa 2.0 doesn't support)
 */
export const getCategoryByHandle = cache(async function (
  categoryHandle: string[]
) {
  try {
    // Fetch all categories (cached)
    const { product_categories } = await getCategoriesList(0, 500)
    
    if (!product_categories || product_categories.length === 0) {
      return { product_categories: [] }
    }

    // Build category chain from handle path
    // e.g. ['parent-handle', 'child-handle'] -> find parent, then find child under parent
    const categories: any[] = []
    let currentCategories = product_categories

    for (const handle of categoryHandle) {
      const found = currentCategories.find((c: any) => c.handle === handle)
      if (found) {
        categories.push(found)
        currentCategories = found.category_children || []
      } else {
        // Handle not found in hierarchy - try flat search
        const flatFound = product_categories.find((c: any) => c.handle === handle)
        if (flatFound) {
          categories.push(flatFound)
          currentCategories = flatFound.category_children || []
        }
      }
    }

    return { product_categories: categories }
  } catch (error: any) {
    console.error("[Categories] Error in getCategoryByHandle:", error?.message)
    return { product_categories: [] }
  }
})

