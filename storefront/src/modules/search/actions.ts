"use server"
import { getMedusaHeaders } from "@lib/util/get-medusa-headers"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

interface Hits {
  readonly objectID?: string
  id?: string
  [x: string | number | symbol]: unknown
}

/**
 * Uses MeiliSearch to search for a query
 * Returns basic product data for frontend hydration
 * 
 * IMPORTANT: Search results are NOT cached to ensure fresh results for each query.
 * Each search query should return current results from Meilisearch.
 * 
 * @param {string} query - search query
 * @param {number} offset - pagination offset
 * @param {string} countryCode - country code (uz, etc.)
 * @param {string} locale - locale code (ru, uz, etc.)
 */
export async function search(query: string, offset: number = 0, countryCode: string = "uz", locale: string = "ru") {
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/search`)
  url.searchParams.set("q", query)
  url.searchParams.set("limit", "24")
  url.searchParams.set("offset", offset.toString())
  url.searchParams.set("locale", locale)

  const headers = getMedusaHeaders()

  // Log search request for debugging
  console.log(`[Search Action] Request: query="${query}", offset=${offset}, locale=${locale}`)

  try {
    const res = await fetch(url.toString(), {
      headers,
      // Disable caching for search - each query should return fresh results
      // This prevents issues where different queries return cached results from previous searches
      cache: 'no-store',
    })

    if (!res.ok) {
        console.error(`[Search Action] Network error: ${res.status} for query="${query}"`)
        return { hits: [], estimatedTotalHits: 0, mode: "search" }
    }

    const data = await res.json()
    
    // Log search response for debugging
    console.log(`[Search Action] Response: query="${query}", hits=${data.hits?.length || 0}, total=${data.estimatedTotalHits || 0}`)
    
    return data
  } catch (err) {
    console.error(`[Search Action] Fetch failed for query="${query}":`, err)
    return { hits: [], estimatedTotalHits: 0, mode: "search" }
  }
}
