import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MeiliSearch } from 'meilisearch'
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from '../../../../../lib/constants'

const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_ADMIN_KEY,
})

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { q } = req.query as { q: string }

  if (!q) {
    return res.json({ products: [], categories: [], brands: [] })
  }

  const index = client.index('products')

  // Search for products
  const results = await index.search(q, {
    limit: 10,
    attributesToRetrieve: ['id', 'title', 'handle', 'thumbnail', 'categories', 'metadata'],
  })

  // Extract unique categories and brands from hits
  const categoriesMap = new Map()
  const brandsSet = new Set()

  results.hits.forEach((hit: any) => {
    if (hit.categories) {
      hit.categories.forEach((cat: any) => {
        categoriesMap.set(cat.id, { id: cat.id, title: cat.title, handle: cat.handle })
      })
    }
    if (hit.metadata?.brand) {
      brandsSet.add(hit.metadata.brand)
    }
  })

  res.json({
    products: results.hits.slice(0, 5),
    categories: Array.from(categoriesMap.values()).slice(0, 3),
    brands: Array.from(brandsSet).slice(0, 3),
  })
}
