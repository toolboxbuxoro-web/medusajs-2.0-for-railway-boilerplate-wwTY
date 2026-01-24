import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from '../../../lib/constants'

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { q, limit = "20", offset = "0", locale = "ru" } = req.query as Record<string, any>
    const query = (q || "").trim()
    const searchLocale = (locale || "ru").toLowerCase()
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Search API] Query received:', { raw: q, processed: query, locale: searchLocale })
    }
    
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
    
    // Determine searchable attributes based on locale
    // For Russian (ru): prioritize title, brand, seo_keywords
    // For Uzbek (uz): prioritize title_uz, brand, seo_keywords
    const isUzbekLocale = searchLocale === 'uz' || searchLocale === 'uz-uz'
    const primaryTitleField = isUzbekLocale ? 'title_uz' : 'title'
    
    // Prepare filters
    // We explicitly filter for published products only
    const filters: string[] = ["status = published"]

    let searchBody: any = {
      limit: limitNum,
      offset: offsetNum,
      filter: filters.join(" AND "),
      // Only retrieve fields needed for hydration + display fallback
      attributesToRetrieve: [
        'id', 
        'title', 
        'title_uz',
        'handle', 
        'thumbnail', 
        'status', 
        'metadata',
        'variants', // For "Add to Cart" logic
        'brand', 
        'images', // For fallback and gallery hover
      ],
      attributesToHighlight: [primaryTitleField, 'title'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      showRankingScore: true,
    }

    // 1. Recommendation Mode (Empty query)
    if (!query) {
      mode = 'recommendation'
      searchBody.q = ""
      searchBody.sort = ["sales_count:desc", "created_at:desc"]
    } else {
      // 2. Search Mode with locale-aware searchable attributes
      mode = 'search'
      searchBody.q = query
      
      // Prioritize search in the correct language field
      // Meilisearch will search in all searchableAttributes, but we can boost the primary field
      // by using rankingRules or by adjusting the order of searchableAttributes
      // For now, we rely on the searchableAttributes configuration in meilisearch-settings.ts
      // which already includes both title and title_uz
    }

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Search API] Meilisearch request:', JSON.stringify(searchBody, null, 2))
    }

    let results = await fetchMeili(searchBody)
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Search API] Meilisearch response:', { 
        hits: results?.hits?.length || 0, 
        total: results?.estimatedTotalHits || 0,
        query: searchBody.q 
      })
    }

    // 3. Fallback Mode (If search hits are 0 AND it's the first page)
    if (mode === 'search' && (!results || results.hits.length === 0) && offsetNum === 0) {
      mode = 'fallback'
      const fallbackBody = {
        ...searchBody,
        q: "",
        sort: ["sales_count:desc", "created_at:desc"],
        offset: offsetNum
      }
      results = await fetchMeili(fallbackBody)
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

    // Post-process results to prioritize locale-specific content
    // For Russian: prioritize products with title (not just title_uz)
    // For Uzbek: prioritize products with title_uz
    let processedHits = results.hits || []
    
    if (mode === 'search' && processedHits.length > 0) {
      processedHits = processedHits.sort((a: any, b: any) => {
        const aHasPrimaryTitle = isUzbekLocale 
          ? Boolean(a.title_uz && a.title_uz.trim())
          : Boolean(a.title && a.title.trim())
        const bHasPrimaryTitle = isUzbekLocale 
          ? Boolean(b.title_uz && b.title_uz.trim())
          : Boolean(b.title && b.title.trim())
        
        // Products with primary title come first
        if (aHasPrimaryTitle && !bHasPrimaryTitle) return -1
        if (!aHasPrimaryTitle && bHasPrimaryTitle) return 1
        return 0 // Keep original Meilisearch ranking
      })
    }

    // Return Meilisearch hits directly
    // Frontend will hydrate with prices via getProductsById
    
    // Cache for 5 minutes (300s)
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=300')
    
    res.json({
      hits: processedHits,
      estimatedTotalHits: results.estimatedTotalHits || 0,
      query: query,
      mode: mode,
      limit: limitNum,
      offset: offsetNum,
      processingTimeMs: results.processingTimeMs,
      // Signal to frontend that hydration is needed
      requiresHydration: true
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
