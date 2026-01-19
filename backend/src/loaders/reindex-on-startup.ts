import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { transformProductToSearchDocument } from "../lib/search-transformer"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from "../lib/constants"

/**
 * One-time reindex loader - runs on server startup.
 * DISABLE AFTER FIRST DEPLOY by commenting out the export or deleting this file.
 */
export default async function reindexOnStartup(container: MedusaContainer) {
  // Skip if Meilisearch not configured
  if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
    console.log("[ReindexLoader] Skipping - Meilisearch not configured")
    return
  }

  console.log("[ReindexLoader] 🚀 Starting one-time reindex...")

  try {
    const productService = container.resolve(Modules.PRODUCT)
    
    // Get all products with variants
    const products = await productService.listProducts(
      {},
      {
        relations: ["variants", "categories"],
        take: 5000 // Adjust if you have more products
      }
    )

    console.log(`[ReindexLoader] Found ${products.length} products`)

    // Transform all products
    const documents = products.map(product => transformProductToSearchDocument(product))

    // Send to Meilisearch in batches
    const BATCH_SIZE = 100
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE)
      
      const res = await fetch(`${MEILISEARCH_HOST}/indexes/products/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
        body: JSON.stringify(batch),
      })

      if (!res.ok) {
        console.error(`[ReindexLoader] ❌ Batch failed: ${res.status}`)
      } else {
        console.log(`[ReindexLoader] ✅ Indexed ${Math.min(i + BATCH_SIZE, documents.length)}/${documents.length}`)
      }
    }

    console.log("[ReindexLoader] ✨ Reindex complete! You can now disable this loader.")
  } catch (error) {
    console.error("[ReindexLoader] ❌ Error:", error)
  }
}
