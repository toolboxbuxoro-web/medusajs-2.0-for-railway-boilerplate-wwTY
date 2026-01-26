import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY } from '../../../lib/constants'

/**
 * Admin endpoint to update Meilisearch settings
 * This applies the filterableAttributes including 'status' to the products index
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    if (!MEILISEARCH_HOST || !MEILISEARCH_ADMIN_KEY) {
      return res.status(503).json({
        error: "Meilisearch not configured",
        message: "MEILISEARCH_HOST or MEILISEARCH_ADMIN_KEY not set"
      })
    }

    const index = "products"
    const url = `${MEILISEARCH_HOST}/indexes/${index}/settings`

    const settings = {
      searchableAttributes: [
        "title",
        "brand",
        "title_uz",
        "subtitle",
        "seo_keywords",
        "handle",
        "description",
        "variant_sku",
        "categories.title"
      ],
      filterableAttributes: [
        "categories.id",
        "brand",
        "in_stock",
        "price",
        "status"
      ],
      sortableAttributes: [
        "created_at",
        "updated_at",
        "price",
        "sales_count",
        "rating_avg"
      ]
    }

    console.log('[Meilisearch Settings] Updating settings for products index...')

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
      },
      body: JSON.stringify(settings),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Meilisearch Settings] Failed to update:', {
        status: response.status,
        error: errorText
      })
      return res.status(response.status).json({
        error: "Failed to update Meilisearch settings",
        status: response.status,
        details: errorText
      })
    }

    const task = await response.json()
    console.log('[Meilisearch Settings] Settings update task submitted:', task.taskUid)

    // Wait a bit and check task status
    await new Promise(resolve => setTimeout(resolve, 2000))

    const taskResponse = await fetch(`${MEILISEARCH_HOST}/tasks/${task.taskUid}`, {
      headers: {
        'Authorization': `Bearer ${MEILISEARCH_ADMIN_KEY}`,
      },
    })

    const taskStatus = await taskResponse.json()

    return res.json({
      success: true,
      taskUid: task.taskUid,
      taskStatus: taskStatus.status,
      message: taskStatus.status === 'succeeded' 
        ? 'Settings updated successfully' 
        : `Task status: ${taskStatus.status}`,
      settings
    })

  } catch (error: any) {
    console.error('[Meilisearch Settings] Error:', error)
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    })
  }
}
