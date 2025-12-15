/**
 * Test script to verify MXIK code is being included in Payme fiscalization detail
 * Run: npx medusa exec src/scripts/test-mxik-fiscalization.ts
 */

import { ExecArgs } from "@medusajs/framework/types"

export default async function testMxikFiscalization({ container }: ExecArgs) {
  const logger = container.resolve("logger") as any
  const pgConnection = container.resolve("__pg_connection__") as any

  console.log("\n=== Testing MXIK Fiscalization Logic ===\n")

  try {
    // 1. Check products with MXIK codes
    const productsWithMxik = await pgConnection.raw(`
      SELECT 
        id,
        title,
        metadata->>'mxik_code' as mxik_code
      FROM product
      WHERE metadata->>'mxik_code' IS NOT NULL
      LIMIT 10
    `)

    const products = productsWithMxik?.rows || []
    console.log(`✅ Found ${products.length} products with MXIK codes:\n`)
    
    if (products.length === 0) {
      console.log("⚠️  No products have MXIK codes yet!")
      console.log("   Add MXIK code to products via admin panel.\n")
    } else {
      products.forEach((p: any) => {
        console.log(`   - ${p.title}: ${p.mxik_code}`)
      })
    }

    // 2. Check recent cart items to simulate fiscalization
    const recentCartItems = await pgConnection.raw(`
      SELECT 
        cli.id,
        cli.title,
        cli.product_title,
        cli.variant_title,
        cli.quantity,
        cli.unit_price,
        cli.product_id,
        p.metadata as product_metadata
      FROM cart_line_item cli
      LEFT JOIN product p ON p.id = cli.product_id
      ORDER BY cli.created_at DESC
      LIMIT 5
    `)

    const items = recentCartItems?.rows || []
    console.log(`\n✅ Recent cart items (${items.length}):\n`)

    items.forEach((row: any) => {
      const title = row.product_title 
        ? (row.variant_title ? `${row.product_title} - ${row.variant_title}` : row.product_title)
        : (row.title || "Товар")

      const productMetadata = typeof row.product_metadata === 'string' 
        ? JSON.parse(row.product_metadata) 
        : (row.product_metadata || {})
      
      const mxikCode = productMetadata.mxik_code || null

      console.log(`   📦 ${title}`)
      console.log(`      Price: ${row.unit_price} tiyin, Qty: ${row.quantity}`)
      console.log(`      MXIK: ${mxikCode ? `✅ ${mxikCode}` : '❌ NOT SET'}`)
      console.log()
    })

    // 3. Simulate actual detail object generation
    console.log("=== Simulated Payme detail object ===\n")
    
    const detailItems = items.map((row: any) => {
      const title = row.product_title 
        ? (row.variant_title ? `${row.product_title} - ${row.variant_title}` : row.product_title)
        : (row.title || "Товар")

      const productMetadata = typeof row.product_metadata === 'string' 
        ? JSON.parse(row.product_metadata) 
        : (row.product_metadata || {})
      
      const mxikCode = productMetadata.mxik_code || null

      const item: any = {
        title: title.substring(0, 128),
        price: Math.round(Number(row.unit_price)),
        count: Number(row.quantity),
        vat_percent: 12
      }

      if (mxikCode) {
        item.code = mxikCode
      }

      return item
    })

    const detail = {
      receipt_type: 0,
      items: detailItems
    }

    console.log(JSON.stringify(detail, null, 2))

    // 4. Check if any items are missing MXIK
    const missingMxik = detailItems.filter((item: any) => !item.code)
    if (missingMxik.length > 0) {
      console.log(`\n⚠️  WARNING: ${missingMxik.length} items WITHOUT MXIK code!`)
      missingMxik.forEach((item: any) => {
        console.log(`   - ${item.title}`)
      })
    } else if (detailItems.length > 0) {
      console.log("\n✅ All items have MXIK codes!")
    }

  } catch (error) {
    console.error("❌ Error:", error)
  }

  console.log("\n=== Test Complete ===\n")
}
