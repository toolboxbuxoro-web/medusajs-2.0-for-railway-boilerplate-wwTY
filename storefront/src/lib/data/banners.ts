import { cache } from "react"

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
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/banners`, {
    next: { tags: ["banners"], revalidate: 60 },
  })

  if (!res.ok) {
    return [] as Banner[]
  }

  const json = (await res.json()) as { banners?: Banner[] }
  return Array.isArray(json.banners) ? json.banners : []
})


