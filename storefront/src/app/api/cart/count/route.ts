import { NextResponse } from "next/server"
import { retrieveCartItemCount } from "@lib/data/cart"

export async function GET() {
  try {
    const totalItems = await retrieveCartItemCount()
    
    return NextResponse.json({ count: totalItems })
  } catch (error) {
    console.error("Error fetching cart count:", error)
    return NextResponse.json({ count: 0 })
  }
}
