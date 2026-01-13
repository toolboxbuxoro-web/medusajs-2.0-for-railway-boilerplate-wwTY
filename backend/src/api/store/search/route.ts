import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MeiliSearch } from 'meilisearch'
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from '../../../../lib/constants'

const client = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_ADMIN_KEY,
})

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { q, sort, ...filters } = req.query as Record<string, any>

  const index = client.index('products')

  // Construct filters for MeiliSearch
  // Format: (category_ids = category_1) AND (metadata.brand = BrandA)
  const filterArray: string[] = []
  
  if (filters.category_id || filters.category_title) {
    const categoryIds = filters.category_id ? (Array.isArray(filters.category_id) ? filters.category_id : [filters.category_id]) : []
    const categoryTitles = filters.category_title ? (Array.isArray(filters.category_title) ? filters.category_title : [filters.category_title]) : []
    
    const conditions = []
    if (categoryIds.length) conditions.push(`categories.id IN [${categoryIds.map(id => `"${id}"`).join(',')}]`)
    if (categoryTitles.length) conditions.push(`categories.title IN [${categoryTitles.map(t => `"${t}"`).join(',')}]`)
    
    filterArray.push(`(${conditions.join(' OR ')})`)
  }

  if (filters.brand) {
    const brands = Array.isArray(filters.brand) ? filters.brand : [filters.brand]
    filterArray.push(`metadata.brand IN [${brands.map(b => `"${b}"`).join(',')}]`)
  }

  if (filters.min_price || filters.max_price) {
    const min = filters.min_price || 0
    const max = filters.max_price || 100000000 // Large default
    filterArray.push(`metadata.price >= ${min} AND metadata.price <= ${max}`)
  }

  const results = await index.search(q as string, {
    filter: filterArray.join(' AND '),
    sort: sort ? [sort as string] : undefined,
    facets: ['categories.title', 'metadata.brand', 'metadata.price'],
    attributesToHighlight: ['title', 'description'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
    limit: 50,
  })

  res.json(results)
}
