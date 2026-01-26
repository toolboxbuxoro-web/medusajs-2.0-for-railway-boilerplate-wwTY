import { NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"

export async function GET() {
  try {
    const cart = await retrieveCart()
    
    if (!cart || !cart.items) {
      return NextResponse.json({ count: 0 })
    }

    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0)
    
    return NextResponse.json({ count: totalItems })
  } catch (error) {
    console.error("Error fetching cart count:", error)
    return NextResponse.json({ count: 0 })
  }
}
