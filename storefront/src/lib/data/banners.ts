import { cache } from "react"

let MEDUSA_BACKEND_URL = "http://localhost:9000"
if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export type Banner = {
  id: string
  image_url?: string
  href?: string
  title?: string
  subtitle?: string
  description?: string
  cta?: string
  title_uz?: string
  subtitle_uz?: string
  description_uz?: string
  cta_uz?: string
}

export const listBanners = cache(async function () {
  const url = `${MEDUSA_BACKEND_URL}/store/banners`
  
  console.log("[Banners] Fetching from:", url)
  console.log("[Banners] Using API key:", PUBLISHABLE_API_KEY ? `${PUBLISHABLE_API_KEY.slice(0, 10)}...` : "(empty)")
  
  try {
    const res = await fetch(url, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY,
      },
      cache: "no-store", // Always fetch fresh data for banners
    })

    console.log("[Banners] Response status:", res.status, res.statusText)

    if (!res.ok) {
      console.error("[Banners] Failed to fetch:", res.status, res.statusText)
      return [] as Banner[]
    }

    const json = (await res.json()) as { banners?: Banner[] }
    const banners = Array.isArray(json.banners) ? json.banners : []
    
    console.log("[Banners] Received banners count:", banners.length)
    if (banners.length > 0) {
      console.log("[Banners] First banner:", JSON.stringify(banners[0]).slice(0, 200))
    }
    
    return banners
  } catch (error) {
    console.error("[Banners] Fetch error:", error)
    return [] as Banner[]
  }
})


