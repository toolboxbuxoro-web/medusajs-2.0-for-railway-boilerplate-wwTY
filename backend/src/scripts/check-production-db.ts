import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

export default async function checkProductionDb({ container }: ExecArgs) {
  const connectionString = "postgresql://postgres:MVCuwcyVwbOZnthECJZkTNDKlQybrsPO@metro.proxy.rlwy.net:25754/railway"
  
  const client = new Client({ connectionString })
  
  try {
    console.log("Connecting to production database...")
    await client.connect()
    console.log("Connected!\n")

    // First check schema
    console.log("=== Checking cart table schema ===")
    const schemaResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cart'
      ORDER BY ordinal_position
    `)
    console.log("Cart columns:", schemaResult.rows.map(r => r.column_name).join(", "))

    // Get latest carts with only basic columns
    const cartsResult = await client.query(`
      SELECT id, completed_at, created_at
      FROM cart
      ORDER BY created_at DESC
      LIMIT 15
    `)

    console.log("\n=== Latest Carts in Production DB ===\n")
    
    for (const cart of cartsResult.rows) {
      const status = cart.completed_at ? "COMPLETED" : "OPEN"
      console.log(`ID: ${cart.id} | Status: ${status} | Created: ${cart.created_at}`)
    }

    // Check payment_session table
    console.log("\n=== Checking payment_session table ===")
    const psSchemaResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_session'
    `)
    console.log("Payment session columns:", psSchemaResult.rows.map(r => r.column_name).join(", "))

    // Find Payme sessions
    const paymeSessionsResult = await client.query(`
      SELECT id, payment_collection_id, provider_id, amount, status, created_at
      FROM payment_session
      WHERE provider_id LIKE '%payme%'
      ORDER BY created_at DESC
      LIMIT 10
    `)

    console.log("\n=== Payme Payment Sessions ===\n")
    for (const ps of paymeSessionsResult.rows) {
      console.log(`Session ID: ${ps.id}`)
      console.log(`  Provider: ${ps.provider_id}`)
      console.log(`  Amount: ${ps.amount}`)
      console.log(`  Status: ${ps.status}`)
      console.log(`  Collection ID: ${ps.payment_collection_id}`)
      console.log("")
    }

    if (paymeSessionsResult.rows.length > 0) {
      const latest = paymeSessionsResult.rows[0]
      
      // Find cart for this payment collection
      const cartResult = await client.query(`
        SELECT c.id, c.completed_at
        FROM cart c
        JOIN cart_payment_collection cpc ON cpc.cart_id = c.id
        WHERE cpc.payment_collection_id = $1
      `, [latest.payment_collection_id])

      if (cartResult.rows.length > 0) {
        const cart = cartResult.rows[0]
        console.log("===========================================")
        console.log("✅ USE THIS FOR PAYME TESTER:")
        console.log(`   Cart ID (order_id): ${cart.id}`)
        console.log(`   Amount: ${latest.amount}`)
        console.log(`   Cart Status: ${cart.completed_at ? 'COMPLETED' : 'OPEN'}`)
        console.log("===========================================")
      }
    }

  } catch (error) {
    console.error("Database error:", error)
  } finally {
    await client.end()
  }
}
