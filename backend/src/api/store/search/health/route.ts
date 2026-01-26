import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from '../../../../lib/constants'

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      hasHost: !!MEILISEARCH_HOST,
      hasKey: !!MEILISEARCH_ADMIN_KEY,
      host: MEILISEARCH_HOST ? `${MEILISEARCH_HOST.substring(0, 20)}...` : null
    },
    health: {
      status: 'unknown',
      meilisearch: null,
      index: null,
      testSearch: null
    }
  }

  try {
    // 1. Check environment variables
    if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
      diagnostics.health.status = 'error'
      diagnostics.health.error = 'Missing MEILISEARCH_HOST or MEILISEARCH_ADMIN_KEY'
      return res.status(503).json(diagnostics)
    }

    // 2. Check Meilisearch health
    try {
      const healthResponse = await fetch(`${MEILISEARCH_HOST}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
      })

      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        diagnostics.health.meilisearch = {
          status: 'ok',
          data: healthData
        }
      } else {
        diagnostics.health.meilisearch = {
          status: 'error',
          statusCode: healthResponse.status,
          statusText: healthResponse.statusText
        }
      }
    } catch (error: any) {
      diagnostics.health.meilisearch = {
        status: 'error',
        error: error.message
      }
    }

    // 3. Check if products index exists and get stats
    try {
      const statsResponse = await fetch(`${MEILISEARCH_HOST}/indexes/products/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        diagnostics.health.index = {
          status: 'ok',
          exists: true,
          numberOfDocuments: statsData.numberOfDocuments || 0,
          isIndexing: statsData.isIndexing || false,
          fieldDistribution: statsData.fieldDistribution || {}
        }
      } else if (statsResponse.status === 404) {
        diagnostics.health.index = {
          status: 'error',
          exists: false,
          error: 'Index "products" not found'
        }
      } else {
        diagnostics.health.index = {
          status: 'error',
          statusCode: statsResponse.status,
          statusText: statsResponse.statusText
        }
      }
    } catch (error: any) {
      diagnostics.health.index = {
        status: 'error',
        error: error.message
      }
    }

    // 4. Test search query
    try {
      const testSearchResponse = await fetch(`${MEILISEARCH_HOST}/indexes/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
        },
        body: JSON.stringify({
          q: '',
          limit: 1,
          filter: 'status = published'
        }),
      })

      if (testSearchResponse.ok) {
        const testSearchData = await testSearchResponse.json()
        diagnostics.health.testSearch = {
          status: 'ok',
          hits: testSearchData.hits?.length || 0,
          estimatedTotalHits: testSearchData.estimatedTotalHits || 0,
          processingTimeMs: testSearchData.processingTimeMs || 0
        }
      } else {
        const errorText = await testSearchResponse.text()
        diagnostics.health.testSearch = {
          status: 'error',
          statusCode: testSearchResponse.status,
          statusText: testSearchResponse.statusText,
          error: errorText
        }
      }
    } catch (error: any) {
      diagnostics.health.testSearch = {
        status: 'error',
        error: error.message
      }
    }

    // Determine overall status
    const hasErrors = 
      diagnostics.health.meilisearch?.status === 'error' ||
      diagnostics.health.index?.status === 'error' ||
      diagnostics.health.testSearch?.status === 'error'

    if (hasErrors) {
      diagnostics.health.status = 'degraded'
    } else if (
      diagnostics.health.meilisearch?.status === 'ok' &&
      diagnostics.health.index?.status === 'ok' &&
      diagnostics.health.testSearch?.status === 'ok'
    ) {
      diagnostics.health.status = 'ok'
    }

    // Return appropriate status code
    const statusCode = diagnostics.health.status === 'ok' ? 200 : 
                      diagnostics.health.status === 'degraded' ? 200 : 503

    return res.status(statusCode).json(diagnostics)

  } catch (error: any) {
    console.error('[Search Health API] Critical error:', error)
    diagnostics.health.status = 'error'
    diagnostics.health.error = error.message
    return res.status(500).json(diagnostics)
  }
}
