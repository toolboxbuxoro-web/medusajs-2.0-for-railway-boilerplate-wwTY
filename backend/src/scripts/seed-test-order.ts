import { ExecArgs } from "@medusajs/framework/types"

/**
 * Seed a test completed order for testing review eligibility
 * Run: npx medusa exec src/scripts/seed-test-order.ts
 */
export default async function seedTestOrder({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const pgConnection = container.resolve("__pg_connection__")

  const customerId = "cus_01KF2NG1AZ612WY8SFQBKQM3S5"
  const productId = "prod_01KEBSWVV8GNB1714HRRM53NTB"
  const variantId = "variant_01KEBSWVWYGQQZDAS61FFPR188"
  const regionId = "reg_01KEBSWVMYG9HF1MZ3Q47124X2"
  const salesChannelId = "sc_01KEBSVZZ8BCWTSXBV5QMZEDD3"

  try {
    logger.info(`[seed-test-order] Creating test completed order...`)

    // Generate unique IDs
    const orderId = `order_test_${Date.now()}`
    const orderItemId = `oi_test_${Date.now()}`
    const orderLineItemId = `oli_test_${Date.now()}`

    // 1. Create order
    await pgConnection.raw(`
      INSERT INTO "order" (id, status, customer_id, region_id, sales_channel_id, currency_code, created_at, updated_at, version)
      VALUES (?, 'completed', ?, ?, ?, 'uzs', NOW(), NOW(), 1)
    `, [orderId, customerId, regionId, salesChannelId])
    logger.info(`[seed-test-order] Created order: ${orderId}`)

    // 2. Create order_line_item (has product_id, variant_id)
    await pgConnection.raw(`
      INSERT INTO order_line_item (id, title, product_id, variant_id, unit_price, raw_unit_price, created_at, updated_at)
      VALUES (?, 'Test Product', ?, ?, 100000, '{"value": "100000", "precision": 20}', NOW(), NOW())
    `, [orderLineItemId, productId, variantId])
    logger.info(`[seed-test-order] Created order_line_item: ${orderLineItemId}`)

    // 3. Create order_item (links order to order_line_item)
    await pgConnection.raw(`
      INSERT INTO order_item (id, order_id, item_id, quantity, raw_quantity, version, created_at, updated_at)
      VALUES (?, ?, ?, 1, '{"value": "1", "precision": 20}', 1, NOW(), NOW())
    `, [orderItemId, orderId, orderLineItemId])
    logger.info(`[seed-test-order] Created order_item: ${orderItemId}`)

    logger.info(`[seed-test-order] ========================================`)
    logger.info(`[seed-test-order] Test order created successfully!`)
    logger.info(`[seed-test-order] Order ID: ${orderId}`)
    logger.info(`[seed-test-order] Customer ID: ${customerId}`)
    logger.info(`[seed-test-order] Product ID: ${productId}`)
    logger.info(`[seed-test-order] ========================================`)

  } catch (error: any) {
    logger.error(`[seed-test-order] Error: ${error.message}`)
    logger.error(`[seed-test-order] Stack: ${error.stack}`)
  }
}
