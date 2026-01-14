import { MeiliSearch } from "meilisearch"

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
    const client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_ADMIN_KEY,
    })

    const index = client.index("products")

    // Update searchableAttributes with proper priority order
    await index.updateSettings({
      searchableAttributes: [
        "title",                    // Primary product name (RU/EN)
        "metadata.brand",           // Brand name (e.g., "Number One")
        "metadata.title_uz",        // Uzbek translation
        "subtitle",
        "metadata.seo_keywords",    // SEO keywords
        "handle",                   // URL slug
        "description",
        "variant_sku",
        "categories.title"
      ],
    })

    console.log("[Meilisearch] ✅ products searchableAttributes ensured")
  } catch (error: any) {
    console.error("[Meilisearch] ❌ Failed to ensure search schema:", error.message)
  }
}
