import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { transformProductToSearchDocument } from "../lib/search-transformer"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from "../lib/constants"

export default async function reindexSearch({ container }: ExecArgs) {
  console.log("🚀 Starting Full Search Re-indexing...")

  if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
    console.error("❌ Meilisearch not configured in .env")
    return
  }

  const productService = container.resolve(Modules.PRODUCT)
  
  // 1. Get total count
  const [, count] = await productService.listAndCountProducts({})
  console.log(`📦 Found ${count} products to index`)

  const BATCH_SIZE = 50
  let processed = 0

  while (processed < count) {
    // 2. Fetch batch with relations
    const products = await productService.listProducts(
      {},
      {
        skip: processed,
        take: BATCH_SIZE,
        relations: ["variants", "categories"]
      }
    )

    if (products.length === 0) break

    // 3. Transform
    const documents = products.map(product => transformProductToSearchDocument(product))

    // 4. Send to Meilisearch
    try {
      const res = await fetch(`${MEILISEARCH_HOST}/indexes/products/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
        body: JSON.stringify(documents),
      })

      if (!res.ok) {
        throw new Error(`Failed to index batch: ${res.status} ${await res.text()}`)
      }

      processed += products.length
      console.log(`✅ Indexed products ${processed}/${count}`)
    } catch (err) {
      console.error("❌ Error indexing batch:", err)
    }
  }

  console.log("✨ Re-indexing complete!")
}
