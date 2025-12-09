import { ExecArgs } from "@medusajs/framework/types"

export default async function checkSpecificCart({ container }: ExecArgs) {
  const remoteQuery = container.resolve("remoteQuery")
  const targetCartId = "cart_01KBQZC32GDZ7BCQ7APFKK94SJ"

  console.log(`\n=== Checking Cart: ${targetCartId} ===\n`)

  // Method 1: Direct remoteQuery like PaymeMerchantService does
  console.log("Method 1: Using remoteQuery with filters (same as PaymeMerchantService)...")
  
  const query1 = await remoteQuery({
    entryPoint: "cart",
    fields: [
      "id",
      "total",
      "currency_code",
      "completed_at",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.data",
      "payment_collection.payment_sessions.amount",
      "payment_collection.payment_sessions.status"
    ],
    filters: { id: targetCartId }
  })

  console.log("Query 1 Result Type:", typeof query1)
  console.log("Query 1 Result:", JSON.stringify(query1, null, 2))

  // Check if cart was found
  const cart = query1[0]
  if (!cart || cart.id !== targetCartId) {
    console.log("\n❌ Cart NOT FOUND with this ID using PaymeMerchantService logic!")
    console.log("Possible reasons:")
    console.log("  1. The cart was already completed and removed")
    console.log("  2. The ID is incorrect")
    console.log("  3. Database connectivity issue")
  } else {
    console.log("\n✅ Cart FOUND!")
    console.log(`   ID: ${cart.id}`)
    console.log(`   Total: ${cart.total}`)
    console.log(`   Completed At: ${cart.completed_at || 'NULL (open)'}`)
    console.log(`   Payment Sessions: ${cart.payment_collection?.payment_sessions?.length || 0}`)
    
    if (cart.payment_collection?.payment_sessions) {
      cart.payment_collection.payment_sessions.forEach((s: any, i: number) => {
        console.log(`   Session ${i + 1}: provider=${s.provider_id}, amount=${s.amount}, status=${s.status}`)
      })
    }
  }

  // Method 2: Get all carts and check if target exists
  console.log("\n\nMethod 2: Fetching all carts to verify...")
  const query2 = await remoteQuery({
    entryPoint: "cart",
    fields: ["id", "total", "completed_at"],
    variables: { take: 20 }
  })

  const allCarts = (query2 as any).rows || query2
  console.log(`Total carts found: ${allCarts?.length || 0}`)
  
  const foundCart = allCarts?.find((c: any) => c.id === targetCartId)
  if (foundCart) {
    console.log(`✅ Target cart exists in all carts list: ${foundCart.id}`)
  } else {
    console.log(`❌ Target cart NOT in all carts list!`)
    console.log("Available cart IDs:")
    allCarts?.slice(0, 10).forEach((c: any) => console.log(`  - ${c.id}`))
  }
}
