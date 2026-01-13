"use server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

interface Hits {
  readonly objectID?: string
  id?: string
  [x: string | number | symbol]: unknown
}

/**
 * Uses MeiliSearch or Algolia to search for a query
 * @param {string} query - search query
 */
export async function search(query: string, sortBy?: string, filters?: any) {
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/search`)
  url.searchParams.set("q", query)
  if (sortBy) {
    url.searchParams.set("sort", sortBy)
  }
  
  if (filters) {
    Object.keys(filters).forEach(key => {
      url.searchParams.set(key, filters[key])
    })
  }

  const res = await fetch(url.toString(), {
    cache: "no-store"
  })

  if (!res.ok) {
    throw new Error("Failed to fetch search results")
  }

  return await res.json()
}
