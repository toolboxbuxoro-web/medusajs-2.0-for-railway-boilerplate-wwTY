import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Debug script to check order_item schema and verify review eligibility.
 * Run: medusa run script debug-review-eligibility
 */
export default async function debugReviewEligibility({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const pgConnection = container.resolve("__pg_connection__")

  logger.info(`[debug-review-eligibility] Starting debug...`)

  try {
    // 1. Check order_item table structure
    logger.info(`[debug-review-eligibility] Checking order_item table columns...`)
    const columnsResult = await pgConnection.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_item'
      ORDER BY ordinal_position
    `)
    logger.info(`[debug-review-eligibility] order_item columns:`)
    columnsResult.rows.forEach((col: any) => {
      logger.info(`  - ${col.column_name} (${col.data_type})`)
    })

    // 2. Check sample order_item data
    logger.info(`[debug-review-eligibility] Sample order_item data:`)
    const sampleItems = await pgConnection.raw(`
      SELECT id, order_id, variant_id, product_id, title 
      FROM order_item 
      LIMIT 3
    `)
    sampleItems.rows.forEach((item: any) => {
      logger.info(`  - ${JSON.stringify(item)}`)
    })

    // 3. Check a completed order and its items
    logger.info(`[debug-review-eligibility] Completed orders:`)
    const completedOrders = await pgConnection.raw(`
      SELECT o.id, o.status, o.customer_id, COUNT(oi.id) as item_count
      FROM "order" o
      LEFT JOIN order_item oi ON o.id = oi.order_id
      WHERE o.status = 'completed'
      GROUP BY o.id
      LIMIT 3
    `)
    completedOrders.rows.forEach((order: any) => {
      logger.info(`  - Order: ${order.id}, Status: ${order.status}, Customer: ${order.customer_id}, Items: ${order.item_count}`)
    })

    // 4. Test the review eligibility query (simplified)
    if (completedOrders.rows.length > 0) {
      const testOrder = completedOrders.rows[0]
      logger.info(`[debug-review-eligibility] Testing eligibility query for order ${testOrder.id}...`)
      
      const eligibilityResult = await pgConnection.raw(`
        SELECT DISTINCT o.id as order_id, oi.variant_id, pv.product_id
        FROM "order" o
        JOIN order_item oi ON o.id = oi.order_id
        JOIN product_variant pv ON oi.variant_id = pv.id
        WHERE o.id = ?
          AND o.status = 'completed'
        LIMIT 5
      `, [testOrder.id])
      
      logger.info(`[debug-review-eligibility] Eligibility query result:`)
      eligibilityResult.rows.forEach((row: any) => {
        logger.info(`  - ${JSON.stringify(row)}`)
      })
    }

  } catch (error: any) {
    logger.error(`[debug-review-eligibility] Error: ${error.message}`)
    logger.error(`[debug-review-eligibility] Stack: ${error.stack}`)
  }
}
