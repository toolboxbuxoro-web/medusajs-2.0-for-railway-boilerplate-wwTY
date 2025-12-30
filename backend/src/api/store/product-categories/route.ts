import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Custom Categories API] Request received", {
    query: req.query,
    url: req.url,
  })

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  // Get query parameters
  const { handle, fields, limit = 100, offset = 0 } = req.query

  // Build fields array - always include metadata
  const defaultFields = [
    "id",
    "name",
    "description",
    "handle",
    "is_active",
    "is_internal",
    "rank",
    "parent_category_id",
    "parent_category",
    "metadata",
    "category_children.*",
    "category_children.metadata",
  ]

  // Parse additional fields from query if provided
  let requestedFields = defaultFields
  if (fields && typeof fields === "string") {
    const additionalFields = fields.split(",").map((f) => f.trim())
    requestedFields = [...new Set([...defaultFields, ...additionalFields])]
  }

  // Build filters
  const filters: any = {}
  if (handle) {
    filters.handle = Array.isArray(handle) ? handle : [handle]
  }

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "product_category",
    variables: {
      filters,
      take: Number(limit),
      skip: Number(offset),
    },
    fields: requestedFields,
  })

  console.log("[Custom Categories API] Query object:", JSON.stringify(queryObject, null, 2))

  try {
    const { rows, metadata } = await remoteQuery(queryObject)

    console.log("[Custom Categories API] Success:", {
      count: rows?.length,
      hasMetadata: rows?.[0]?.metadata ? "yes" : "no",
      firstCategory: rows?.[0] ? {
        id: rows[0].id,
        name: rows[0].name,
        handle: rows[0].handle,
        metadata: rows[0].metadata,
      } : null,
    })

    res.json({
      product_categories: rows || [],
      count: metadata?.count || rows?.length || 0,
      offset: Number(offset),
      limit: Number(limit),
    })
  } catch (error) {
    console.error("[Custom Categories API] Error fetching categories:", error)
    res.status(500).json({
      error: "Failed to fetch categories",
      message: error.message,
    })
  }
}
