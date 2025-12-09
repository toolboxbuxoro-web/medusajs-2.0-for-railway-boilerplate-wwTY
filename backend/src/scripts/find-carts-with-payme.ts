import { ExecArgs } from "@medusajs/framework/types"

export default async function findCartsWithPayme({ container }: ExecArgs) {
  const remoteQuery = container.resolve("remoteQuery")

  console.log("=== Finding carts with Payme payment sessions ===\n")

  const query = await remoteQuery({
    entryPoint: "cart",
    fields: [
      "id",
      "total",
      "currency_code",
      "completed_at",
      "created_at",
      "payment_collection.id",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.amount",
      "payment_collection.payment_sessions.status"
    ],
    variables: { take: 30, order: { created_at: "DESC" } }
  })

  const carts = (query as any).rows || query
  
  // Filter carts with Payme sessions that are OPEN
  const cartsWithPayme = carts.filter((c: any) => {
    const hasPayme = c.payment_collection?.payment_sessions?.some(
      (s: any) => s.provider_id?.includes("payme")
    )
    const isOpen = !c.completed_at
    return hasPayme && isOpen
  })

  console.log(`Found ${cartsWithPayme.length} OPEN carts with Payme sessions:\n`)

  cartsWithPayme.forEach((c: any) => {
    const session = c.payment_collection?.payment_sessions?.find(
      (s: any) => s.provider_id?.includes("payme")
    )
    console.log(`Cart ID: ${c.id}`)
    console.log(`  Amount (cart.total): ${c.total}`)
    console.log(`  Session Amount: ${session?.amount}`)
    console.log(`  Session Status: ${session?.status}`)
    console.log(`  Created: ${c.created_at}`)
    console.log("")
  })

  if (cartsWithPayme.length > 0) {
    const latest = cartsWithPayme[0]
    const session = latest.payment_collection?.payment_sessions?.find(
      (s: any) => s.provider_id?.includes("payme")
    )
    console.log("===========================================")
    console.log("✅ USE THIS FOR PAYME TESTER:")
    console.log(`   Cart ID (order_id): ${latest.id}`)
    console.log(`   Amount: ${Math.round(latest.total)}`)
    console.log("===========================================")
  } else {
    console.log("❌ No open carts with Payme sessions found!")
    console.log("Please go to storefront, add items, go to checkout, and select Payme.")
  }
}
