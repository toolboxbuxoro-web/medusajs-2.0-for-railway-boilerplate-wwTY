import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from '../../../../lib/constants'

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { q } = req.query as { q: string }

  if (!q) {
    return res.json({ products: [], categories: [], brands: [] })
  }

  const searchBody = {
    q,
    limit: 10,
    attributesToRetrieve: ['id', 'title', 'handle', 'thumbnail', 'categories', 'metadata'],
  }

  try {
    const response = await fetch(`${MEILISEARCH_HOST}/indexes/products/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
      },
      body: JSON.stringify(searchBody),
    })

    if (!response.ok) {
      throw new Error(`MeiliSearch error: ${response.status}`)
    }

    const results = await response.json()
    const hits = results.hits || []

    // Extract unique categories and brands from hits
    const categoriesMap = new Map()
    const brandsSet = new Set()

    hits.forEach((hit: any) => {
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
      products: hits.slice(0, 5),
      categories: Array.from(categoriesMap.values()).slice(0, 3),
      brands: Array.from(brandsSet).slice(0, 3),
    })
  } catch (error) {
    console.error('Suggestions error:', error)
    res.status(500).json({ error: 'Suggestions failed' })
  }
}
