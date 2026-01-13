"use server"
import { getMedusaHeaders } from "@lib/util/get-medusa-headers"

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
// Phase 3: Web Search Client Rewrite - Simple Proxy
// "Web must be a thin client"
export async function search(query: string, sortBy?: string, filters?: any) {
  // Ignore filters/sort for now (Phase 0: Disable non-essential features)
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/search`)
  url.searchParams.set("q", query)
  url.searchParams.set("limit", "20")

  // Using centralized header management (P0 fix from previous task)
  const headers = getMedusaHeaders()

  try {
    const res = await fetch(url.toString(), {
      headers,
      cache: "no-store", // Ensure fresh results
    })

    if (!res.ok) {
        // "No silent failures" - but the backend is guaranteed to return 200 OK.
        // If we get here, it's a network/Vercel issue.
        console.error(`[Search Action] Network error: ${res.status}`)
        return { hits: [], estimatedTotalHits: 0 }
    }

    return await res.json()
  } catch (err) {
    console.error(`[Search Action] Fetch failed: ${err}`)
    return { hits: [], estimatedTotalHits: 0 }
  }
}
