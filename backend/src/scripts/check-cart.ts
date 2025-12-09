import { ExecArgs } from "@medusajs/framework/types"

export default async function checkCart({ container }: ExecArgs) {
  const remoteQuery = container.resolve("remoteQuery")
  
  console.log("=== Searching for carts with total ~620729 ===\n")
  
  // Get all carts
  const carts = await remoteQuery({
    entryPoint: "cart",
    fields: [
      "id", 
      "total", 
      "currency_code",
      "created_at",
      "items.title",
      "items.unit_price",
      "items.quantity"
    ]
  })
  
  // Filter carts with total around 620729
  const matchingCarts = carts.filter((c: any) => {
    const total = Number(c.total?.numeric_ || c.total)
    return total >= 600000 && total <= 700000
  })
  
  console.log(`Found ${matchingCarts.length} carts with total between 600000-700000:\n`)
  
  matchingCarts.forEach((cart: any) => {
    console.log("---")
    console.log("Cart ID:", cart.id)
    console.log("Total:", cart.total?.numeric_ || cart.total)
    console.log("Currency:", cart.currency_code)
    console.log("Created:", cart.created_at)
    if (cart.items?.length) {
      console.log("Items:")
      cart.items.forEach((item: any) => {
        const price = item.unit_price?.numeric_ || item.unit_price
        console.log(`  - ${item.title}: ${price} x ${item.quantity}`)
      })
    }
  })
  
  // Also show last 5 carts
  console.log("\n\n=== Last 5 carts ===\n")
  const sortedCarts = carts.sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5)
  
  sortedCarts.forEach((cart: any) => {
    console.log("---")
    console.log("Cart ID:", cart.id)
    console.log("Total:", cart.total?.numeric_ || cart.total)
    console.log("Currency:", cart.currency_code)
    console.log("Created:", cart.created_at)
  })
}
