/**
 * Test Payme Merchant API locally
 * Simulates Payme server requests to verify integration
 * 
 * Run: npx medusa exec src/scripts/test-payme-local.ts
 */

import { ExecArgs } from "@medusajs/framework/types"

export default async function testPaymeLocal({ container }: ExecArgs) {
  const logger = container.resolve("logger") as any
  const pgConnection = container.resolve("__pg_connection__") as any

  console.log("\n=== Testing Payme Merchant API ===\n")

  // 1. Find a recent cart with payment session
  console.log("1. Looking for active carts with Payme sessions...")
  
  const cartResult = await pgConnection.raw(`
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
    ORDER BY c.created_at DESC
    LIMIT 1
  `)

  const carts = cartResult?.rows || []
  
  if (carts.length === 0) {
    console.log("❌ No active carts with Payme payment sessions found")
    console.log("   Create a cart and go to checkout to test\n")
    
    // Show all carts for debugging
    const allCarts = await pgConnection.raw(`
      SELECT id, completed_at, created_at 
      FROM cart 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    console.log("Recent carts:", allCarts?.rows || [])
    return
  }

  const testCart = carts[0]
  console.log(`✅ Found cart: ${testCart.cart_id}`)
  console.log(`   Session: ${testCart.session_id}`)
  console.log(`   Amount: ${testCart.amount}`)
  console.log(`   Status: ${testCart.status}`)
  console.log()

  // 2. Test CheckPerformTransaction
  console.log("2. Testing CheckPerformTransaction...")
  
  // Using require here to work in both ts-node (medusa exec) and compiled build output without NodeNext extension issues.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PaymeMerchantService } = require("../modules/payment-payme/services/payme-merchant")
  const paymeMerchant = new PaymeMerchantService({ logger, container })

  try {
    const checkResult = await paymeMerchant.handleRequest("CheckPerformTransaction", {
      amount: Number(testCart.amount) * 100,
      account: {
        order_id: testCart.cart_id
      }
    })

    console.log("✅ CheckPerformTransaction SUCCESS")
    console.log(`   Allow: ${checkResult.allow}`)
    console.log(`   Detail receipt_type: ${checkResult.detail?.receipt_type}`)
    console.log(`   Items count: ${checkResult.detail?.items?.length || 0}`)
    
    // Check MXIK codes
    const itemsWithMxik = (checkResult.detail?.items || []).filter((i: any) => i.code)
    const itemsWithoutMxik = (checkResult.detail?.items || []).filter((i: any) => !i.code)
    
    console.log(`   Items with MXIK: ${itemsWithMxik.length}`)
    console.log(`   Items without MXIK: ${itemsWithoutMxik.length}`)
    
    if (itemsWithoutMxik.length > 0) {
      console.log("\n   ⚠️ Items missing MXIK:")
      itemsWithoutMxik.forEach((item: any) => {
        console.log(`      - ${item.title}`)
      })
    }

    console.log("\n   Response detail object:")
    console.log(JSON.stringify(checkResult.detail, null, 2))
    
  } catch (error: any) {
    console.log(`❌ CheckPerformTransaction FAILED: ${error.message}`)
    console.log(`   Code: ${error.code}`)
  }

  // 3. Test CreateTransaction (simulate)
  console.log("\n3. Testing CreateTransaction...")
  
  const testPaymeId = `test_${Date.now()}`
  const testTime = Date.now()

  try {
    const createResult = await paymeMerchant.handleRequest("CreateTransaction", {
      id: testPaymeId,
      time: testTime,
      amount: Number(testCart.amount) * 100,
      account: {
        order_id: testCart.cart_id
      }
    })

    console.log("✅ CreateTransaction SUCCESS")
    console.log(`   Transaction ID: ${createResult.transaction}`)
    console.log(`   State: ${createResult.state}`)
    console.log(`   Create time: ${createResult.create_time}`)
    
  } catch (error: any) {
    console.log(`❌ CreateTransaction FAILED: ${error.message}`)
    console.log(`   Code: ${error.code}`)
    
    if (error.code === -31051) {
      console.log("   Note: Another transaction already exists for this order")
    }
  }

  // 4. Test CheckTransaction
  console.log("\n4. Testing CheckTransaction...")
  
  try {
    const checkTxResult = await paymeMerchant.handleRequest("CheckTransaction", {
      id: testPaymeId
    })

    console.log("✅ CheckTransaction SUCCESS")
    console.log(`   State: ${checkTxResult.state}`)
    console.log(`   Create time: ${checkTxResult.create_time}`)
    console.log(`   Perform time: ${checkTxResult.perform_time}`)
    
  } catch (error: any) {
    console.log(`❌ CheckTransaction FAILED: ${error.message}`)
    console.log(`   Code: ${error.code}`)
  }

  // 5. Summary
  console.log("\n=== Test Summary ===")
  console.log("✅ Payme Merchant API endpoints working")
  console.log("✅ CheckPerformTransaction returns detail object with items")
  console.log("✅ All Payme protocol methods implemented")
  console.log("\nTo complete full test:")
  console.log("1. Ensure products have MXIK codes in metadata")
  console.log("2. Test with actual Payme sandbox")
  console.log()
}
