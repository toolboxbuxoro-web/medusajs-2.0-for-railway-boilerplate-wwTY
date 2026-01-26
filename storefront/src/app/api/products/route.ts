import { NextRequest, NextResponse } from "next/server"
import { getProductsList } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get("offset") || "0", 10)
    const limit = parseInt(searchParams.get("limit") || "12", 10)
    const countryCode = searchParams.get("countryCode") || "uz"

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: "Invalid offset parameter" },
        { status: 400 }
      )
    }

    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Invalid limit parameter (must be between 1 and 50)" },
        { status: 400 }
      )
    }

    // Calculate page from offset
    const page = Math.floor(offset / limit) + 1

    // Get products with pagination
    const { response, nextPage } = await getProductsList({
      pageParam: page,
      queryParams: {
        limit,
      },
      countryCode,
    })

    const { products, count } = response

    if (!products || products.length === 0) {
      return NextResponse.json({
        products: [],
        hasMore: false,
        nextOffset: null,
        total: 0,
      })
    }

    // Calculate if there are more products
    const nextOffset = offset + limit
    const hasMore = nextPage !== null && nextOffset < count

    return NextResponse.json({
      products,
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
      total: count,
    })
  } catch (error) {
    console.error("[API Products] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}
