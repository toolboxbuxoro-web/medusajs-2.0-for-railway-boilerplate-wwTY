import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from '../../../lib/constants'

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { q, limit = "20", offset = "0" } = req.query as Record<string, any>
    const query = (q || "").trim().toLowerCase()
    
    // Limits
    const limitNum = Math.min(parseInt(limit) || 20, 100)
    const offsetNum = parseInt(offset) || 0

    const fetchMeili = async (searchParams: any) => {
      const response = await fetch(`${MEILISEARCH_HOST}/indexes/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
        body: JSON.stringify(searchParams),
      })
      if (!response.ok) return null
      return response.json()
    }

    let mode: 'search' | 'recommendation' | 'fallback' = 'search'
    let searchBody: any = {
      limit: limitNum,
      offset: offsetNum,
      attributesToRetrieve: ['id', 'title', 'handle', 'thumbnail', 'status', 'metadata', 'variants', 'brand', 'title_uz', 'seo_keywords'],
      attributesToHighlight: ['title'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      showRankingScore: true,
    }

    // 1. Recommendation Mode (Empty query)
    if (!query) {
      mode = 'recommendation'
      searchBody.q = ""
      searchBody.sort = ["metadata.sales_count:desc", "created_at:desc"] // Popular & New
    } else {
      // 2. Search Mode
      mode = 'search'
      searchBody.q = query
    }

    let results = await fetchMeili(searchBody)

    // 3. Fallback Mode (If search hits are 0 AND it's the first page)
    if (mode === 'search' && (!results || results.hits.length === 0) && offsetNum === 0) {
      mode = 'fallback'
      // Re-fetch recommendations as fallback
      const fallbackBody = {
        ...searchBody,
        q: "",
        sort: ["metadata.sales_count:desc", "created_at:desc"],
        offset: offsetNum // Keep offset for infinite scroll in fallback
      }
      results = await fetchMeili(fallbackBody)
    }

    // 4. Hydrate with Medusa API
    let hydratedHits = []
    
    if (results && results.hits && results.hits.length > 0) {
      const productIds = results.hits.map((h: any) => h.id)
      
      const { currency_code, region_id } = req.query as Record<string, any>
      const remoteQuery = req.scope.resolve("remoteQuery")
      
      const queryContext = {
        ...(region_id && { region_id }),
        ...(currency_code && { currency_code }),
      }

      // Fetch full products with calculated prices
      const { data: products } = await remoteQuery({
        entryPoint: "product",
        fields: [
          "id",
          "title",
          "subtitle",
          "handle",
          "thumbnail",
          "description",
          "status",
          "created_at",
          "metadata",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.options",
          "variants.calculated_price.*", 
          "variants.inventory_quantity",
          "variants.manage_inventory",
          "variants.allow_backorder",
        ],
        variables: {
          filters: { id: productIds },
          context: queryContext
        }
      })

      // Map back to preserve Meilisearch order & highlighting
      hydratedHits = productIds.map((id: string) => {
        const product = (products as any[]).find((p: any) => p.id === id)
        if (!product) return null
        
        // Merge meili highlights if needed, but primarily use fresh product data
        const hit = results.hits.find((h: any) => h.id === id)
        
        return {
            ...product, // Use fresh data as base
            _formatted: hit?._formatted, // Keep meilisearch formatting/highlights
        }
      }).filter(Boolean)
    } else if (results) {
        // Empty hits but results exists
        hydratedHits = []
    }

    if (!results) {
      return res.json({
        hits: [],
        estimatedTotalHits: 0,
        query: query,
        mode: mode,
        error: "Search provider error"
      })
    }

    res.json({
      hits: hydratedHits,
      estimatedTotalHits: results.estimatedTotalHits || 0,
      query: query,
      mode: mode,
      limit: limitNum,
      offset: offsetNum,
      processingTimeMs: results.processingTimeMs
    })

  } catch (error) {
    console.error('[Search API] Critical error:', error)
    res.json({
      hits: [],
      estimatedTotalHits: 0,
      query: req.query.q || "",
      mode: 'search', 
      error: "Internal server error"
    })
  }
}
