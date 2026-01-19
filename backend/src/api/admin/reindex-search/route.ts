import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { transformProductToSearchDocument } from "../../../lib/search-transformer"

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST
const MEILISEARCH_ADMIN_KEY = process.env.MEILISEARCH_ADMIN_KEY

/**
 * Manual reindex endpoint - call to trigger product reindexing
 * GET /admin/reindex-search
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
    return res.status(500).json({ error: "Meilisearch not configured" })
  }

  try {
    const productService = req.scope.resolve(Modules.PRODUCT)
    
    // Get all products with variants and prices
    const products = await productService.listProducts(
      {},
      {
        relations: ["variants", "variants.prices", "categories"],
        take: 5000
      }
    )

    console.log(`[ManualReindex] Found ${products.length} products`)

    // Transform all products
    const documents = products.map(product => transformProductToSearchDocument(product))

    // Send to Meilisearch in batches
    const BATCH_SIZE = 100
    let indexed = 0
    
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE)
      
      const meilisearchRes = await fetch(`${MEILISEARCH_HOST}/indexes/products/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
        body: JSON.stringify(batch),
      })

      if (!meilisearchRes.ok) {
        console.error(`[ManualReindex] Batch ${i} failed: ${meilisearchRes.status}`)
      } else {
        indexed += batch.length
        console.log(`[ManualReindex] Indexed ${indexed}/${documents.length}`)
      }
    }

    return res.json({
      success: true,
      message: `Reindexed ${indexed} products`,
      total: products.length
    })
  } catch (error: any) {
    console.error("[ManualReindex] Error:", error)
    return res.status(500).json({ error: error.message })
  }
}
