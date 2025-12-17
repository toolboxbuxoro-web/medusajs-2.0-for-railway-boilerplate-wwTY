/**
 * Script to manually complete a paid cart that failed to create an order
 * Run: npx medusa exec src/scripts/complete-paid-cart.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

export default async function completePaidCart({ container }: ExecArgs) {
  const logger = container.resolve("logger") as any
  const pgConnection = container.resolve("__pg_connection__") as any

  console.log("\n=== Complete Paid Cart ===\n")

  // Find carts with paid payment sessions that weren't completed
  const result = await pgConnection.raw(`
    SELECT 
      c.id as cart_id,
      ps.id as session_id,
      ps.amount,
      ps.data,
      ps.status
    FROM cart c
    JOIN cart_payment_collection cpc ON cpc.cart_id = c.id
    JOIN payment_session ps ON ps.payment_collection_id = cpc.payment_collection_id
    WHERE ps.provider_id LIKE '%payme%'
      AND c.completed_at IS NULL
      AND (ps.data->>'payme_state')::int = 2
    ORDER BY c.created_at DESC
  `)

  const carts = result?.rows || []

  if (carts.length === 0) {
    console.log("❌ No paid but uncompleted carts found")
    return
  }

  console.log(`Found ${carts.length} paid but uncompleted carts:\n`)

  for (const cart of carts) {
    console.log(`📦 Cart: ${cart.cart_id}`)
    console.log(`   Session: ${cart.session_id}`)
    console.log(`   Amount: ${cart.amount} UZS`)
    console.log(`   Payme State: ${cart.data?.payme_state}`)
    
    try {
      // Update session to ensure payme_state is 2
      const paymentModule = container.resolve(Modules.PAYMENT)
      const sessionData = typeof cart.data === 'string' ? JSON.parse(cart.data) : cart.data
      
      await paymentModule.updatePaymentSession({
        id: cart.session_id,
        amount: Number(cart.amount),
        currency_code: "uzs",
        data: {
          ...sessionData,
          payme_state: 2
        }
      })

      // Complete the cart
      await completeCartWorkflow(container).run({
        input: { id: cart.cart_id }
      })
      
      console.log(`   ✅ Successfully completed cart!`)
    } catch (e: any) {
      console.log(`   ❌ Failed to complete: ${e?.message || e}`)
    }
    console.log()
  }

  console.log("=== Done ===\n")
}
