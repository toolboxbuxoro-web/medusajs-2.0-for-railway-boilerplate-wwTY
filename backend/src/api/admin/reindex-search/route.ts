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
    const pricingService = req.scope.resolve(Modules.PRICING)
    
    // Get all products with variants and categories
    const products = await productService.listProducts(
      {},
      {
        relations: ["variants", "categories"],
        take: 5000
      }
    )

    console.log(`[ManualReindex] Found ${products.length} products`)

    // Get prices for all variant IDs
    const allVariantIds = products.flatMap((p: any) => 
      p.variants?.map((v: any) => v.id) || []
    ).filter(Boolean)

    let priceMap: Record<string, number> = {}
    
    if (allVariantIds.length > 0) {
      try {
        // Try to get prices from pricing module
        const priceSets = await pricingService.listPriceSets({
          id: allVariantIds
        })
        
        for (const priceSet of priceSets) {
          if (priceSet.prices && priceSet.prices.length > 0) {
            // Get the first/lowest price
            const lowestPrice = Math.min(...priceSet.prices.map((p: any) => p.amount))
            priceMap[priceSet.id] = lowestPrice
          }
        }
      } catch (e) {
        console.log("[ManualReindex] Could not fetch prices from pricing module, using metadata fallback")
      }
    }

    // Transform all products with price data
    const documents = products.map((product: any) => {
      const doc = transformProductToSearchDocument(product)
      
      // Try to get price from priceMap for first variant
      if (product.variants?.length > 0 && !doc.price) {
        const variantId = product.variants[0].id
        if (priceMap[variantId]) {
          doc.price = priceMap[variantId]
        }
      }
      
      return doc
    })

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
      total: products.length,
      pricesFound: Object.keys(priceMap).length
    })
  } catch (error: any) {
    console.error("[ManualReindex] Error:", error)
    return res.status(500).json({ error: error.message })
  }
}
