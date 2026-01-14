import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { transformProductToSearchDocument } from "../lib/search-transformer.js"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from "../lib/constants.js"

/**
 * Subscriber that handles manual product indexing in Meilisearch.
 * This ensures that our rich metadata and flattened fields are 
 * correctly sent to the search engine.
 */
export async function searchIndexer({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
    return
  }

  const productService: IProductModuleService = container.resolve(Modules.PRODUCT)

  try {
    // Dynamic import to handle ESM-only package in CommonJS context
    const { MeiliSearch } = await import("meilisearch")
    // 1. Fetch the product with all necessary relations
    const [product] = await productService.listProducts(
      { id: data.id },
      { 
        relations: ["variants", "categories"],
        take: 1 
      }
    )

    if (!product) {
      console.warn(`[SearchIndexer] Product ${data.id} not found for indexing`)
      return
    }

    // 2. Transform to search document
    const document = transformProductToSearchDocument(product)

    // 3. Push to Meilisearch
    const client = new MeiliSearch({
      host: MEILISEARCH_HOST,
      apiKey: MEILISEARCH_ADMIN_KEY,
    })

    const index = client.index("products")
    await index.addDocuments([document])

    console.log(`[SearchIndexer] ✅ Indexed product ${product.id} ("${product.title}")`)
  } catch (error: any) {
    console.error(`[SearchIndexer] ❌ Failed to index product ${data.id}:`, error.message)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
