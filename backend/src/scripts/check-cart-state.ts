/**
 * Check cart payment session state
 * Run: npx medusa exec src/scripts/check-cart-state.ts
 */

import { ExecArgs } from "@medusajs/framework/types"

export default async function checkCartState({ container }: ExecArgs) {
  const pgConnection = container.resolve("__pg_connection__") as any

  console.log("\n=== Checking Recent Carts State ===\n")

  const result = await pgConnection.raw(`
    SELECT 
      c.id as cart_id,
      c.email,
      c.shipping_address_id IS NOT NULL as has_shipping_address,
      COALESCE((SELECT COUNT(*) FROM cart_shipping_method csm WHERE csm.cart_id = c.id), 0) as shipping_methods_count,
      cpc.payment_collection_id,
      COALESCE((SELECT COUNT(*) FROM payment_session ps WHERE ps.payment_collection_id = cpc.payment_collection_id), 0) as payment_sessions_count,
      (SELECT provider_id FROM payment_session ps WHERE ps.payment_collection_id = cpc.payment_collection_id LIMIT 1) as payment_provider
    FROM cart c
    LEFT JOIN cart_payment_collection cpc ON cpc.cart_id = c.id
    WHERE c.completed_at IS NULL
    ORDER BY c.created_at DESC
    LIMIT 5
  `)

  const carts = result?.rows || []

  console.log(`Found ${carts.length} active carts:\n`)

  carts.forEach((cart: any, i: number) => {
    const checks = {
      shipping_address: cart.has_shipping_address ? '✅' : '❌',
      shipping_methods: Number(cart.shipping_methods_count) > 0 ? '✅' : '❌',
      payment_collection: cart.payment_collection_id ? '✅' : '❌',
    }

    const allChecks = cart.has_shipping_address && 
                       Number(cart.shipping_methods_count) > 0 && 
                       cart.payment_collection_id

    console.log(`Cart ${i+1}: ${cart.cart_id}`)
    console.log(`  Email: ${cart.email || 'N/A'}`)
    console.log(`  Shipping Address: ${checks.shipping_address}`)
    console.log(`  Shipping Methods: ${checks.shipping_methods} (${cart.shipping_methods_count})`)
    console.log(`  Payment Collection: ${checks.payment_collection} (${cart.payment_collection_id || 'NULL'})`)
    console.log(`  Payment Sessions: ${cart.payment_sessions_count}`)
    console.log(`  Provider: ${cart.payment_provider || 'N/A'}`)
    console.log(`  --> previousStepsCompleted: ${allChecks ? '✅ YES' : '❌ NO - button won\'t show!'}`)
    console.log()
  })

  console.log("=== Done ===\n")
}
