import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

/**
 * On-Demand Revalidation API
 * 
 * Call this endpoint to invalidate cached data when storefront data is updated in Medusa.
 * 
 * Usage (POST):
 * - URL: /api/revalidate
 * - Headers: { "x-revalidate-secret": "your-secret-key" }
 * - Body: { "tags": ["products"] } or { "tags": ["products", "collections"] }
 * 
 * Usage for collections metadata:
 * - When you change collection metadata (e.g. `metadata.bg_color`, `metadata.bg_image`, `metadata.text_color`)
 *   in Medusa, call this endpoint with:
 *   - Body: { "tags": ["collections"] }
 *   This will revalidate all pages and components that are tagged with `"collections"` in the storefront.
 * 
 * Valid tags: "products", "collections", "categories", "regions", "banners"
 * 
 * Set REVALIDATION_SECRET environment variable for security.
 */

const VALID_TAGS = ["products", "collections", "categories", "regions", "banners"]

export async function POST(request: NextRequest) {
  try {
    // Verify secret token for security
    const secret = request.headers.get("x-revalidate-secret")
    const expectedSecret = process.env.REVALIDATION_SECRET
    
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tags } = body as { tags?: string[] }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid 'tags' array in body" },
        { status: 400 }
      )
    }

    // Validate and revalidate each tag
    const revalidated: string[] = []
    const invalid: string[] = []

    for (const tag of tags) {
      if (VALID_TAGS.includes(tag)) {
        revalidateTag(tag)
        revalidated.push(tag)
      } else {
        invalid.push(tag)
      }
    }

    console.log(`[Revalidate] Tags revalidated: ${revalidated.join(", ")}`)

    return NextResponse.json({
      success: true,
      revalidated,
      invalid: invalid.length > 0 ? invalid : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Revalidate] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Also support GET for simple cache clearing (with secret in query)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  const tag = searchParams.get("tag") || "products"
  
  const expectedSecret = process.env.REVALIDATION_SECRET
  
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json(
      { error: "Invalid secret" },
      { status: 401 }
    )
  }

  if (!VALID_TAGS.includes(tag)) {
    return NextResponse.json(
      { error: `Invalid tag. Valid tags: ${VALID_TAGS.join(", ")}` },
      { status: 400 }
    )
  }

  revalidateTag(tag)
  console.log(`[Revalidate] Tag revalidated via GET: ${tag}`)

  return NextResponse.json({
    success: true,
    revalidated: [tag],
    timestamp: new Date().toISOString(),
  })
}
