/**
 * ⚠️ Mobile-only endpoint
 * This route MUST NOT be used by the web storefront.
 * Any breaking change here is acceptable ONLY for mobile.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  try {
    // 1. Fetch Store Metadata (Banners)
    const storeQuery = remoteQueryObjectFromString({
      entryPoint: "store",
      variables: { take: 1 },
      fields: ["id", "metadata"],
    })
    const { rows: storeRows } = await remoteQuery(storeQuery)
    const store = storeRows?.[0]

    // Defensive parsing for banners
    const metadata = store?.metadata
    const parsedMeta = typeof metadata === "string"
      ? (() => { try { return JSON.parse(metadata) } catch { return {} } })()
      : metadata || {}

    const rawBanners = Array.isArray(parsedMeta?.banners) ? parsedMeta.banners : []
    const mobileBanners = rawBanners.filter((b: any) => {
      const device = b?.metadata?.device || b?.device // Check both if device is direct prop or in meta
      return device === "mobile" || device === "all" || !device
    })

    // 2. Fetch Top-Level Categories
    const categoryQuery = remoteQueryObjectFromString({
      entryPoint: "product_category",
      variables: {
        filters: { parent_category_id: null },
        take: 20
      },
      fields: ["id", "name", "handle", "metadata"],
    })
    const { rows: categoriesRows } = await remoteQuery(categoryQuery)
    const categories = Array.isArray(categoriesRows) ? categoriesRows : []

    // 3. Fetch Collections
    const collectionQuery = remoteQueryObjectFromString({
      entryPoint: "product_collection",
      variables: { take: 100 },
      fields: ["id", "title", "handle", "metadata"],
    })
    const { rows: collectionsRows } = await remoteQuery(collectionQuery)
    const collections = Array.isArray(collectionsRows) ? collectionsRows : []

    // 4. Construct Sections
    const sections: any[] = []

    // -- Section: Banner Slider --
    if (mobileBanners.length > 0) {
      sections.push({
        id: "hero",
        type: "banner_slider",
        data: mobileBanners.map((b: any) => ({
          id: b.id,
          image: b.image_url,
          action: b.href,
          title: { ru: b.title, uz: b.title_uz || b.title }
        }))
      })
    }

    // -- Section: Category Chips --
    if (categories.length > 0) {
      sections.push({
        id: "categories",
        type: "category_chips",
        data_source: "/store/product-categories?parent_id=null"
      })
    }

    // -- Section: Product Rails (Collections) --
    const mobileCollections = collections.filter((c: any) => c.metadata?.mobile_home === true)

    // Stable Sorting
    mobileCollections.sort((a: any, b: any) => {
      const orderA = a.metadata?.mobile_order
      const orderB = b.metadata?.mobile_order

      if (orderA == null && orderB == null) return 0
      if (orderA == null) return 1
      if (orderB == null) return -1
      return Number(orderA) - Number(orderB)
    })

    mobileCollections.forEach((c: any) => {
      sections.push({
        id: `collection_${c.handle || c.id}`,
        type: "product_rail",
        collection_id: c.id,
        title: {
          ru: c.metadata?.title_ru || c.title,
          uz: c.metadata?.title_uz || c.title
        }
      })
    })

    res.json({ sections })
  } catch (error: any) {
    console.error("[Mobile Home Feed API] Error:", error)
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message 
    })
  }
}
