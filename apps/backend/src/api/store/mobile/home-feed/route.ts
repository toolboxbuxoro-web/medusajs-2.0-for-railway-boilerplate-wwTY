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

  // 0. Resolve Active Experiment (Backend-Driven)
  // This helps serve different UX variants to different users without client logic.
  // We prioritize the x-experiment header, which could be set by a gateway or hash logic.
  const rawHeader = req.headers["x-experiment"] as string
  const activeExperiment = rawHeader ? rawHeader.trim().toLowerCase() : "control"

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

    // 4. Construct Sections with CMS Control
    // This endpoint is MOBILE-ONLY. DO NOT reuse for web storefront.
    const candidateSections: any[] = []

    // -- Section: Banner Slider --
    // Global visibility and order can be controlled via store.metadata.mobile_sections.hero
    const heroMeta = parsedMeta?.mobile_sections?.hero || {}
    const isHeroEnabled = heroMeta.mobile_enabled !== false
    
    // Experiment check
    const heroExp = heroMeta.mobile_experiment
    const matchesHeroExp = !heroExp || heroExp === activeExperiment

    if (isHeroEnabled && matchesHeroExp && mobileBanners.length > 0) {
      candidateSections.push({
        id: "hero",
        type: "banner_slider",
        mobile_order: Number(heroMeta.mobile_order) || 0,
        _experiment: heroExp ? { name: heroExp, variant: activeExperiment } : null,
        data: mobileBanners.map((b: any) => ({
          id: b.id,
          image: b.image_url,
          action: b.href,
          title: { ru: b.title, uz: b.title_uz || b.title }
        }))
      })
    }

    // -- Section: Category Chips --
    // Global visibility and order can be controlled via store.metadata.mobile_sections.categories
    const categoryMeta = parsedMeta?.mobile_sections?.categories || {}
    const isCategoryEnabled = categoryMeta.mobile_enabled !== false

    // Experiment check
    const catExp = categoryMeta.mobile_experiment
    const matchesCatExp = !catExp || catExp === activeExperiment

    if (isCategoryEnabled && matchesCatExp && categories.length > 0) {
      candidateSections.push({
        id: "categories",
        type: "category_chips",
        mobile_order: Number(categoryMeta.mobile_order) || 0,
        _experiment: catExp ? { name: catExp, variant: activeExperiment } : null,
        data_source: "/store/product-categories?parent_id=null"
      })
    }

    // -- Section: Product Rails (Collections) --
    // Visibility: metadata.mobile_home must be true (backward-compat) AND mobile_enabled must not be false
    // Experiment: metadata.mobile_experiment must match activeExperiment if present
    // Order: metadata.mobile_order
    collections.forEach((c: any) => {
      const isMobileHome = c.metadata?.mobile_home === true
      const isEnabled = c.metadata?.mobile_enabled !== false
      
      const colExp = c.metadata?.mobile_experiment
      const matchesColExp = !colExp || colExp === activeExperiment

      if (isMobileHome && isEnabled && matchesColExp) {
        candidateSections.push({
          id: `collection_${c.handle || c.id}`,
          type: "product_rail",
          collection_id: c.id,
          mobile_order: Number(c.metadata?.mobile_order) || 0,
          _experiment: colExp ? { name: colExp, variant: activeExperiment } : null,
          title: {
            ru: c.metadata?.title_ru || c.title,
            uz: c.metadata?.title_uz || c.title
          }
        })
      }
    })

    // 5. Stable Sort by mobile_order
    // Treat missing mobile_order as 0. Maintain original order for same-order sections.
    const sections = candidateSections
      .map((s, idx) => ({ ...s, originalIndex: idx }))
      .sort((a, b) => {
        if (a.mobile_order !== b.mobile_order) {
          return a.mobile_order - b.mobile_order
        }
        return a.originalIndex - b.originalIndex
      })
      .map(({ mobile_order, originalIndex, ...section }) => section)

    res.json({ sections })
  } catch (error: any) {
    console.error("[Mobile Home Feed API] Error:", error)
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message 
    })
  }
}
