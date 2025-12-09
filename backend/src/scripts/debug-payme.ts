import { ExecArgs } from "@medusajs/framework/types"

export default async function debugPayme({ container }: ExecArgs) {
  const remoteQuery = container.resolve("remoteQuery")
  
  const testOrderId = "3a81ce39-2747-466f-8287-6efd7b3dab79"
  
  console.log("=== Debugging getPaymentSession for order_id:", testOrderId, "===\n")
  
  // Simulate exactly what getPaymentSession does
  const query = await remoteQuery({
    entryPoint: "cart",
    fields: [
      "id",
      "total",
      "currency_code",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.data",
      "payment_collection.payment_sessions.amount",
      "payment_collection.payment_sessions.status"
    ],
    filters: { id: testOrderId }
  })
  
  console.log("Query result length:", query.length)
  console.log("Query result:", JSON.stringify(query, null, 2))
  
  const cart = query[0]
  
  if (!cart) {
    console.log("\n✅ Cart NOT found (expected for test order_id)")
  } else {
    console.log("\n⚠️ Cart found unexpectedly!")
    console.log("Cart ID:", cart.id)
    console.log("Cart Total:", cart.total)
  }
  
  // Also check ALL carts to see if 620729 exists anywhere
  console.log("\n\n=== Checking all carts for 620729 total ===")
  const allCarts = await remoteQuery({
    entryPoint: "cart",
    fields: ["id", "total", "currency_code"]
  })
  
  console.log("Total carts in database:", allCarts.length)
  
  allCarts.forEach((c: any) => {
    const total = Number(c.total?.numeric_ || c.total)
    console.log(`Cart ${c.id}: ${total} ${c.currency_code}`)
    if (total === 620729) {
      console.log("^^^ THIS ONE HAS 620729! ^^^")
    }
  })
}
