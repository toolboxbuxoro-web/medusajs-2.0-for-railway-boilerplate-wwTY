/**
 * Explicitly ensures that the products index in Meilisearch
 * has the correct searchableAttributes configuration.
 * 
 * This is critical because the medusa-plugin-meilisearch does NOT
 * guarantee that searchableAttributes are applied to the actual index.
 * 
 * This function is idempotent and safe to call on every startup.
 */
export async function ensureProductSearchSchema() {
  if (!process.env.MEILISEARCH_HOST || !process.env.MEILISEARCH_ADMIN_KEY) {
    console.warn("[Meilisearch] Missing MEILISEARCH_HOST or MEILISEARCH_ADMIN_KEY, skipping schema setup")
    return
  }

  try {
    // Dynamic import to handle ESM-only package in CommonJS context
    const { MeiliSearch } = await import("meilisearch")

    const client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_ADMIN_KEY,
    })

    const index = client.index("products")

    // Update searchableAttributes with proper priority order
    // NOTE: We use flattened names (brand, title_uz, etc.) provided by our transformer
    await index.updateSettings({
      searchableAttributes: [
        "title",                    // Primary product name (RU/EN)
        "brand",                    // Flattened brand name (e.g., "Number One")
        "title_uz",                 // Flattened Uzbek translation
        "subtitle",
        "seo_keywords",             // Flattened SEO keywords
        "handle",                   // URL slug
        "description",
        "variant_sku",
        "categories.title"
      ],
      filterableAttributes: [
        "categories.id",
        "brand",
        "in_stock",
        "price",
        "status"
      ],
      sortableAttributes: [
        "created_at",
        "updated_at",
        "price",
        "sales_count",
        "rating_avg"
      ]
    })

    console.log("[Meilisearch] ✅ products searchableAttributes ensured")
  } catch (error: any) {
    console.error("[Meilisearch] ❌ Failed to ensure search schema:", error.message)
  }
}
