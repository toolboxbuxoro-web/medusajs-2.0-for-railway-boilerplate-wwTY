import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { transformProductToSearchDocument } from "../lib/search-transformer"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from "../lib/constants"

/**
 * Subscriber that handles automatic product indexing in Meilisearch.
 * Triggered on product.created and product.updated events.
 */
export default async function searchIndexer({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
    console.log("[SearchIndexer] Skipping - Meilisearch not configured")
    return
  }

  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

  try {
    // 1. Fetch the product with all necessary relations
    const [product] = await productService.listProducts(
      { id: data.id },
      { 
        relations: ["variants", "categories", "images"],
        take: 1 
      }
    )

    if (!product) {
      console.warn(`[SearchIndexer] Product ${data.id} not found`)
      return
    }

    // 2. Transform to search document
    const document = transformProductToSearchDocument(product)

    // 3. Push to Meilisearch via fetch (more reliable than SDK in subscribers)
    const response = await fetch(`${MEILISEARCH_HOST}/indexes/products/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
      },
      body: JSON.stringify([document]),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Meilisearch error: ${response.status} - ${error}`)
    }

    console.log(`[SearchIndexer] ✅ Indexed "${product.title}" (${product.id})`)
  } catch (error: any) {
    console.error(`[SearchIndexer] ❌ Failed to index ${data.id}:`, error.message)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
