import { cache } from "react"
import { getMedusaHeaders } from "@lib/util/get-medusa-headers"

let MEDUSA_BACKEND_URL = "http://localhost:9000"
if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
}

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
  
  try {
    const res = await fetch(url, {
      headers: getMedusaHeaders(),
      cache: "no-store",
    })

    if (!res.ok) {
      console.error("[Banners] Failed to fetch:", res.status, res.statusText)
      return [] as Banner[]
    }

    const json = (await res.json()) as { banners?: Banner[] }
    const banners = Array.isArray(json.banners) ? json.banners : []
    
    return banners
  } catch (error) {
    console.error("[Banners] Fetch error:", error)
    return [] as Banner[]
  }
})













