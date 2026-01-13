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

    // 1. If query is empty, return empty results immediately (don't waste Meili req)
    if (!query) {
      return res.json({
        hits: [],
        estimatedTotalHits: 0,
        query: "",
        limit: limitNum,
        offset: offsetNum,
        processingTimeMs: 0
      })
    }

    // 2. Search Meilisearch (Products Index)
    const searchBody = {
      q: query,
      limit: limitNum,
      offset: offsetNum,
      attributesToRetrieve: [
        'id', 
        'title', 
        'handle', 
        'thumbnail', 
        'status',
        'metadata', 
        'variants' // Needed if we display implementation details
      ],
      attributesToHighlight: ['title'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      showRankingScore: true,
      // Minimal filtering (can be expanded later, but keep simple for now)
      filter: []
    }

    const response = await fetch(`${MEILISEARCH_HOST}/indexes/products/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
      },
      body: JSON.stringify(searchBody),
    })

    if (!response.ok) {
      // Log error but return empty results to client for stability
      console.error(`[Search API] MeiliSearch error: ${response.status}`)
      return res.json({
        hits: [],
        estimatedTotalHits: 0,
        query: query,
        error: "Search provider error" // Optional debug info
      })
    }

    const results = await response.json()
    
    // 3. Return Standard Response
    res.json({
      hits: results.hits || [],
      estimatedTotalHits: results.estimatedTotalHits || 0,
      query: query,
      limit: limitNum,
      offset: offsetNum,
      processingTimeMs: results.processingTimeMs
    })

  } catch (error) {
    console.error('[Search API] Critical error:', error)
    // Always return 200 OK with empty results to prevent UI crash
    res.json({
      hits: [],
      estimatedTotalHits: 0,
      query: req.query.q || "",
      error: "Internal server error"
    })
  }
}
