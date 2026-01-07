import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

function isExperimentAllowed(metadata: any, activeExperiment?: string): boolean {
  if (!activeExperiment) {
    return true
  }

  const itemExperiment = metadata?.experiment
  if (!itemExperiment) {
    return true
  }

  if (Array.isArray(itemExperiment)) {
    return itemExperiment.includes(activeExperiment)
  }

  return itemExperiment === activeExperiment
}

function isDeviceAllowed(device?: string): boolean {
  if (!device || device === "all" || device === "mobile") {
    return true
  }
  return false
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const activeExperiment = req.headers["x-experiment"] as string | undefined
  
  const sections: any[] = []

  /**
   * 1. Fetch Store safely
   */
  const { data: stores } = await remoteQuery({
    entryPoint: "store",
    fields: ["id", "metadata"],
  }) as { data: any[] }

  const store = Array.isArray(stores) && stores.length > 0 ? stores[0] : null
  const storeMetadata = store?.metadata || {}

  /**
   * 1.1 BANNER SLIDER
   * Source: Store metadata "banners"
   */
  const bannersRaw = Array.isArray(storeMetadata.banners) ? storeMetadata.banners : []
  
  const mobileBanners = bannersRaw
    .filter((b: any) => {
      const deviceMatch = isDeviceAllowed(b.device)
      return deviceMatch && isExperimentAllowed(b.metadata, activeExperiment)
    })
    .sort((a: any, b: any) => (Number(a.mobile_order) || 0) - (Number(b.mobile_order) || 0))

  if (mobileBanners.length > 0) {
    sections.push({
      type: "banner_slider",
      order: 1,
      items: mobileBanners
    })
  }

  /**
   * 2. CATEGORY CHIPS
   * Source: Product Categories
   */
  const { data: categories } = await remoteQuery({
    entryPoint: "product_category",
    fields: ["id", "name", "metadata", "handle"],
    variables: {
      filters: { is_active: true }
    }
  }) as { data: any[] }

  const chipCategories = categories
    .filter((c: any) => {
      const isMobile = c.metadata?.mobile_home === true && isDeviceAllowed(c.metadata?.device)
      return isMobile && isExperimentAllowed(c.metadata, activeExperiment)
    })
    .map((c: any) => ({
      id: c.id,
      title: c.name,
      handle: c.handle,
      icon: c.metadata?.icon || undefined,
      _sort_order: Number(c.metadata?.mobile_order) || 0
    }))
    .sort((a: any, b: any) => a._sort_order - b._sort_order)
    .map(({ _sort_order, ...item }) => item)

  if (chipCategories.length > 0) {
    sections.push({
      type: "category_chips",
      order: 10,
      items: chipCategories
    })
  }

  /**
   * 3. PRODUCT RAILS
   * Source: Collections
   */
  const { data: collections } = await remoteQuery({
    entryPoint: "product_collection",
    fields: ["id", "title", "metadata", "handle"],
  }) as { data: any[] }

  const railCollections = collections
    .filter((coll: any) => {
      const isMobile = coll.metadata?.mobile_home === true && isDeviceAllowed(coll.metadata?.device)
      return isMobile && isExperimentAllowed(coll.metadata, activeExperiment)
    })
    .sort((a: any, b: any) => (Number(a.metadata?.mobile_order) || 0) - (Number(b.metadata?.mobile_order) || 0))

  for (const coll of railCollections) {
    const { data: products } = await remoteQuery({
      entryPoint: "product",
      fields: [
        "id", 
        "title", 
        "handle", 
        "thumbnail", 
        "metadata",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.inventory_quantity"
      ],
      variables: {
        filters: {
          collection_id: coll.id,
          status: "published"
        },
        take: 12
      }
    }) as { data: any[] }

    const filteredProducts = products.filter(p => 
      isExperimentAllowed(p.metadata, activeExperiment) && 
      isDeviceAllowed(p.metadata?.device)
    )

    if (filteredProducts.length > 0) {
      sections.push({
        type: "product_rail",
        order: 100 + (Number(coll.metadata?.mobile_order) || 0),
        title: coll.metadata?.title_ru || coll.metadata?.title_uz || coll.title,
        products: filteredProducts
      })
    }
  }

  // Final sort by assigned order ASC
  sections.sort((a, b) => a.order - b.order)

  return res.json({ sections })
}
