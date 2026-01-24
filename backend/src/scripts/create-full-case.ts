import { ExecArgs } from "@medusajs/framework/types"
import * as jwt from "jsonwebtoken"

/**
 * Full test case creator:
 * 1. Creates/Updates a customer: testuser@toolbox.uz
 * 2. Creates a completed order for a real product
 * 3. Generates a JWT token for "login"
 * 
 * Run: npx medusa exec src/scripts/create-full-case.ts
 */
export default async function createFullCase({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const pgConnection = container.resolve("__pg_connection__")
  const query = container.resolve("query")

  const email = "testuser@toolbox.uz"
  const password = "password123" // Just for reference
  const JWT_SECRET = process.env.JWT_SECRET || "supersecret"

  try {
    logger.info(`[create-full-case] Starting...`)

    // 1. Find a product
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "variants.id"],
      pagination: { take: 1 }
    })

    const product = products?.[0]
    if (!product) throw new Error("No products found")
    
    const productId = product.id
    const variantId = product.variants?.[0]?.id

    if (!variantId) throw new Error(`Product ${productId} has no variants`)

    logger.info(`[create-full-case] Using Product: ${product.title} (${productId})`)

    // 2. Create/Update Customer
    // First, check if exists
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email"],
      filters: { email }
    })

    let customerId: string

    if (customers && customers.length > 0) {
      customerId = customers[0].id
      logger.info(`[create-full-case] Existing customer found: ${customerId}`)
    } else {
      // Create new customer via PG to avoid complex module calls for a test script
      customerId = `cus_test_${Date.now()}`
      await pgConnection.raw(`
        INSERT INTO "customer" (id, email, first_name, last_name, created_at, updated_at)
        VALUES (?, ?, 'Test', 'User', NOW(), NOW())
      `, [customerId, email])
      logger.info(`[create-full-case] Created new customer: ${customerId}`)
    }

    // 3. Create completed order
    const orderId = `order_test_${Date.now()}`
    const orderLineItemId = `oli_test_${Date.now()}`
    const orderItemId = `oi_test_${Date.now()}`

    // We need region_id and sales_channel_id. Let's pick any.
    const { data: regions } = await query.graph({ entity: "region", fields: ["id"], pagination: { take: 1 } })
    const { data: salesChannels } = await query.graph({ entity: "sales_channel", fields: ["id"], pagination: { take: 1 } })

    const regionId = regions?.[0]?.id || "reg_default"
    const salesChannelId = salesChannels?.[0]?.id || "sc_default"

    // Insert Order
    await pgConnection.raw(`
      INSERT INTO "order" (id, status, customer_id, region_id, sales_channel_id, currency_code, created_at, updated_at, version)
      VALUES (?, 'completed', ?, ?, ?, 'uzs', NOW(), NOW(), 1)
    `, [orderId, customerId, regionId, salesChannelId])


    // Insert Line Item
    await pgConnection.raw(`
      INSERT INTO order_line_item (id, title, product_id, variant_id, unit_price, raw_unit_price, created_at, updated_at)
      VALUES (?, ?, ?, ?, 100000, '{"value": "100000", "precision": 20}', NOW(), NOW())
    `, [orderLineItemId, product.title, productId, variantId])

    // Insert Order Item (Link)
    await pgConnection.raw(`
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
      )
      VALUES (
        ?, ?, ?, 1, '{"value": "1", "precision": 20}', 
        1, '{"value": "1", "precision": 20}',
        1, '{"value": "1", "precision": 20}',
        1, '{"value": "1", "precision": 20}',
        0, '{"value": "0", "precision": 20}',
        0, '{"value": "0", "precision": 20}',
        0, '{"value": "0", "precision": 20}',
        0, '{"value": "0", "precision": 20}',
        1, NOW(), NOW()
      )
    `, [orderItemId, orderId, orderLineItemId])


    logger.info(`[create-full-case] Created completed order: ${orderId}`)

    // 4. Generate JWT Token
    // We need an auth_identity_id. Let's create a dummy one or use a placeholder.
    // In Medusa 2.0, req.auth_context.actor_id is enough for many routes.
    const authIdentityId = `auth_test_${Date.now()}`
    
    // Create auth identity to be double sure
    await pgConnection.raw(`
      INSERT INTO auth_identity (id, created_at, updated_at)
      VALUES (?, NOW(), NOW())
    `, [authIdentityId])

    const token = jwt.sign(
      {
        actor_id: customerId,
        auth_identity_id: authIdentityId,
        actor_type: "customer",
        domain: "store",
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    )

    logger.info(`[create-full-case] ========================================`)
    logger.info(`[create-full-case] TEST CASE CREATED SUCCESSFULLY!`)
    logger.info(`[create-full-case] Email: ${email}`)
    logger.info(`[create-full-case] Order ID: ${orderId}`)
    logger.info(`[create-full-case] Product: ${product.title}`)
    logger.info(`[create-full-case] ----------------------------------------`)
    logger.info(`[create-full-case] USE THIS COMMAND IN BROWSER CONSOLE:`)
    logger.info(`document.cookie = 'medusa_auth_token=${token}; path=/'; localStorage.setItem('medusa_auth_token', '${token}'); location.reload();`)
    logger.info(`[create-full-case] ========================================`)

  } catch (error: any) {
    logger.error(`[create-full-case] Error: ${error.message}`)
    logger.error(error.stack)
  }
}
