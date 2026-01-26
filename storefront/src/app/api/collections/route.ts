import { NextRequest, NextResponse } from "next/server"
import { getCollectionsList } from "@lib/data/collections"
import { getProductsList } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get("offset") || "0", 10)
    const limit = parseInt(searchParams.get("limit") || "4", 10)
    const countryCode = searchParams.get("countryCode") || "uz"

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: "Invalid offset parameter" },
        { status: 400 }
      )
    }

    if (isNaN(limit) || limit < 1 || limit > 20) {
      return NextResponse.json(
        { error: "Invalid limit parameter (must be between 1 and 20)" },
        { status: 400 }
      )
    }

    // Get collections with pagination
    const { collections, count } = await getCollectionsList(offset, limit)

    if (!collections || collections.length === 0) {
      return NextResponse.json({
        collections: [],
        hasMore: false,
        nextOffset: null,
        total: 0,
      })
    }

    // Get products for each collection
    const collectionPromises = collections.map(async (collection) => {
      try {
        const { response } = await getProductsList({
          // @ts-ignore
          queryParams: { collection_id: [collection.id], limit: 12 },
          countryCode,
        })

        return {
          ...collection,
          metadata: collection.metadata,
          products: response.products,
        } as unknown as HttpTypes.StoreCollection & { products: HttpTypes.StoreProduct[] }
      } catch (error) {
        console.error(`[API Collections] Error fetching products for collection ${collection.id}:`, error)
        return {
          ...collection,
          metadata: collection.metadata,
          products: [],
        } as unknown as HttpTypes.StoreCollection & { products: HttpTypes.StoreProduct[] }
      }
    })

    const collectionsWithProducts = await Promise.all(collectionPromises)

    // Calculate if there are more collections
    const nextOffset = offset + limit
    const hasMore = nextOffset < count

    return NextResponse.json({
      collections: collectionsWithProducts,
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
      total: count,
    })
  } catch (error) {
    console.error("[API Collections] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    )
  }
}
