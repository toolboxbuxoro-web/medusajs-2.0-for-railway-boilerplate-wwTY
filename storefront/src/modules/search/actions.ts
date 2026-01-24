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
 * @param {string} query - search query
 * @param {string} locale - locale code (ru, uz, etc.)
 */
export async function search(query: string, offset: number = 0, countryCode: string = "uz", locale: string = "ru") {
  const url = new URL(`${MEDUSA_BACKEND_URL}/store/search`)
  url.searchParams.set("q", query)
  url.searchParams.set("limit", "24")
  url.searchParams.set("offset", offset.toString())
  url.searchParams.set("locale", locale)

  const headers = getMedusaHeaders()

  try {
    const res = await fetch(url.toString(), {
      headers,
      cache: "no-store",
    })

    if (!res.ok) {
        console.error(`[Search Action] Network error: ${res.status}`)
        return { hits: [], estimatedTotalHits: 0, mode: "search" }
    }

    return await res.json()
  } catch (err) {
    console.error(`[Search Action] Fetch failed: ${err}`)
    return { hits: [], estimatedTotalHits: 0, mode: "search" }
  }
}
