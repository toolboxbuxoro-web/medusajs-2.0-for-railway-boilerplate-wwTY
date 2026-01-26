import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from '../../../lib/constants'

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Check environment variables
    if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
      console.error('[Search API] Missing Meilisearch configuration:', {
        hasHost: !!MEILISEARCH_HOST,
        hasKey: !!MEILISEARCH_ADMIN_KEY
      })
      return res.status(503).json({
        hits: [],
        estimatedTotalHits: 0,
        query: req.query.q || "",
        mode: 'search',
        error: "Search service not configured"
      })
    }

    const { q, limit = "20", offset = "0", locale = "ru" } = req.query as Record<string, any>
    const query = (q || "").trim()
    const searchLocale = (locale || "ru").toLowerCase()
    
    // Log all requests (not just in development)
    console.log('[Search API] Query received:', { 
      raw: q, 
      processed: query, 
      locale: searchLocale,
      limit,
      offset
    })
    
    // Limits
    const limitNum = Math.min(parseInt(limit) || 20, 100)
    const offsetNum = parseInt(offset) || 0

    const fetchMeili = async (searchParams: any) => {
      const url = `${MEILISEARCH_HOST}/indexes/products/search`
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
          },
          body: JSON.stringify(searchParams),
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          let errorData: any = {}
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
          
          // Check if error is about status not being filterable
          if (errorData.code === 'invalid_search_filter' && errorData.message?.includes('status')) {
            console.error('[Search API] ⚠️ Status filter not available yet. Meilisearch settings need to be updated.')
            console.error('[Search API] 💡 Solution: Restart the server or call POST /admin/meilisearch-settings to apply settings')
            // Fallback: retry without status filter
            const fallbackParams = { ...searchParams }
            delete fallbackParams.filter
            console.log('[Search API] Retrying without status filter as fallback...')
            return fetchMeili(fallbackParams)
          }
          
          console.error('[Search API] Meilisearch error:', {
            status: response.status,
            statusText: response.statusText,
            url: url,
            requestBody: JSON.stringify(searchParams),
            errorResponse: errorText
          })
          return null
        }
        
        const data = await response.json()
        
        // Log successful responses
        console.log('[Search API] Meilisearch success:', {
          hits: data?.hits?.length || 0,
          total: data?.estimatedTotalHits || 0,
          query: searchParams.q || '(empty)',
          processingTimeMs: data?.processingTimeMs
        })
        
        return data
      } catch (fetchError: any) {
        console.error('[Search API] Meilisearch fetch failed:', {
          url: url,
          error: fetchError.message,
          stack: fetchError.stack,
          requestBody: JSON.stringify(searchParams)
        })
        return null
      }
    }

    let mode: 'search' | 'recommendation' | 'fallback' = 'search'
    
    // Determine searchable attributes based on locale
    // For Russian (ru): prioritize title, brand, seo_keywords
    // For Uzbek (uz): prioritize title_uz, brand, seo_keywords
    const isUzbekLocale = searchLocale === 'uz' || searchLocale === 'uz-uz'
    const primaryTitleField = isUzbekLocale ? 'title_uz' : 'title'
    
    // Prepare filters
    // Filter for published products only
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

    // Log request details
    console.log('[Search API] Meilisearch request:', {
      mode: mode,
      query: searchBody.q || '(empty)',
      limit: searchBody.limit,
      offset: searchBody.offset,
      filter: searchBody.filter
    })

    let results = await fetchMeili(searchBody)

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
      console.error('[Search API] No results from Meilisearch, returning error response')
      return res.status(503).json({
        hits: [],
        estimatedTotalHits: 0,
        query: query,
        mode: mode,
        error: "Search service unavailable"
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

  } catch (error: any) {
    console.error('[Search API] Critical error:', {
      message: error?.message,
      stack: error?.stack,
      query: req.query.q || "",
      error: error
    })
    return res.status(500).json({
      hits: [],
      estimatedTotalHits: 0,
      query: req.query.q || "",
      mode: 'search',
      error: "Internal server error"
    })
  }
}
