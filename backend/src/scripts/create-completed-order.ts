import { exec } from "child_process"
import { promisify } from "util"
import { Client } from "pg"
import * as dotenv from "dotenv"

dotenv.config()

const execPromise = promisify(exec)

async function run() {
  const phone = process.argv[2] || "998901234567"
  const email = `${phone.replace("+", "")}@phone.local`
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  try {
    console.log(`--- Creating test order for phone: ${phone} ---`)

    // 1. Ensure Customer exists
    let customerId: string
    const resCust = await client.query("SELECT id FROM customer WHERE email = $1", [email])
    if (resCust.rows.length === 0) {
      console.log(`Customer ${email} not found, creating...`)
      const insertCust = await client.query(
        "INSERT INTO customer (email, phone, first_name, has_account) VALUES ($1, $2, $3, $4) RETURNING id",
        [email, phone.startsWith("+") ? phone : `+${phone}`, "Тест Покупатель", true]
      )
      customerId = insertCust.rows[0].id
    } else {
      customerId = resCust.rows[0].id
      console.log(`Customer found: ${customerId}`)
    }

    // 2. Find a Product and Variant
    const resProd = await client.query(`
      SELECT p.id as product_id, v.id as variant_id, v.sku, p.title as product_title
      FROM product p
      JOIN product_variant v ON v.product_id = p.id
      WHERE p.status = 'published'
      LIMIT 1
    `)

    if (resProd.rows.length === 0) {
      throw new Error("No published products found in database")
    }

    const { product_id, variant_id, sku, product_title } = resProd.rows[0]
    console.log(`Using Product: ${product_id}, Variant: ${variant_id} (${sku})`)

    // 3. Create Order
    const orderId = `ord_test_${Math.random().toString(36).substring(7)}`
    const displayId = Math.floor(1000 + Math.random() * 9000)
    
    // Get region
    const resRegion = await client.query("SELECT id FROM region LIMIT 1")
    const regionId = resRegion.rows[0]?.id || "reg_default"

    console.log(`Creating Order: ${orderId}...`)
    await client.query(`
      INSERT INTO "order" (
        id, display_id, customer_id, region_id, email, 
        currency_code, status, version,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `, [orderId, displayId, customerId, regionId, email, 'uzs', 'completed', 1])

    // 4. Create Order Line Item
    const lineItemId = `li_test_${Math.random().toString(36).substring(7)}`
    console.log(`Creating Line Item: ${lineItemId}...`)
    await client.query(`
      INSERT INTO order_line_item (
        id, product_id, variant_id, title, unit_price, 
        is_tax_inclusive, created_at, updated_at, variant_sku,
        requires_shipping, is_discountable, raw_unit_price, is_custom_price, is_giftcard
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8, $9, $10, $11, $12)
    `, [
      lineItemId, product_id, variant_id, product_title, 100000, true, sku,
      true, true, { value: 100000, precision: 20 }, false, false
    ])

    // 5. Create Order Item (Link)
    const orderItemId = `oi_test_${Math.random().toString(36).substring(7)}`
    console.log(`Creating Order Item Link: ${orderItemId}...`)
    await client.query(`
      INSERT INTO order_item (
        id, order_id, item_id, quantity, raw_quantity,
        fulfilled_quantity, raw_fulfilled_quantity,
        shipped_quantity, raw_shipped_quantity,
        delivered_quantity, raw_delivered_quantity,
        return_requested_quantity, raw_return_requested_quantity,
        return_received_quantity, raw_return_received_quantity,
        return_dismissed_quantity, raw_return_dismissed_quantity,
        written_off_quantity, raw_written_off_quantity,
        version, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, 
        $6, $7, 
        $8, $9, 
        $10, $11, 
        0, '{"value": 0, "precision": 20}', 
        0, '{"value": 0, "precision": 20}', 
        0, '{"value": 0, "precision": 20}', 
        0, '{"value": 0, "precision": 20}', 
        $12, NOW(), NOW()
      )
    `, [
      orderItemId, orderId, lineItemId, 1, { value: 1, precision: 20 },
      1, { value: 1, precision: 20 },
      1, { value: 1, precision: 20 },
      1, { value: 1, precision: 20 },
      1
    ])

    console.log(`✅ Success! Order ${orderId} created for ${email}.`)
    console.log(`Product: http://localhost:8000/ru/dk/products/${product_id}`)
    console.log(`You can now login with phone ${phone} and code 12345 to leave a review.`)

  } catch (err) {
    console.error("Error creating test data:", err)
  } finally {
    await client.end()
  }
}

run()
