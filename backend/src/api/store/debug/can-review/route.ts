import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * TEMPORARY DEBUG ENDPOINT
 * Returns detailed eligibility info for debugging reviews
 * DELETE THIS AFTER FIXING THE ISSUE
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { product_id, customer_id } = req.query as any

  if (!product_id) {
    return res.status(400).json({ error: "product_id is required" })
  }

  try {
    const pgConnection = req.scope.resolve("__pg_connection__")
    const debug: any = {}

    // Get customer ID from auth if not provided
    const customerId = customer_id || (req as any).auth_context?.actor_id
    debug.customer_id = customerId

    if (!customerId) {
      return res.json({
        can_review: false,
        reason: "no_customer_id",
        debug: { message: "Not logged in or customer_id not provided" }
      })
    }

    // 1. Check all orders for this customer
    const ordersResult = await pgConnection.raw(`
      SELECT o.id, o.status, o.created_at, o.customer_id
      FROM "order" o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [customerId])
    debug.customer_orders = ordersResult?.rows || []

    // 2. Check order items for this customer (join order_line_item for product info)
    const itemsResult = await pgConnection.raw(`
      SELECT oi.id, oi.order_id, oli.variant_id, oli.product_id, oli.title
      FROM order_item oi
      JOIN "order" o ON oi.order_id = o.id
      JOIN order_line_item oli ON oi.item_id = oli.id
      WHERE o.customer_id = ?
      ORDER BY oi.created_at DESC
      LIMIT 10
    `, [customerId])
    debug.order_items = itemsResult?.rows || []

    // 3. Check if any order has this product (join order_line_item)
    const productOrdersResult = await pgConnection.raw(`
      SELECT oi.order_id, oli.product_id, o.status, o.customer_id
      FROM order_item oi
      JOIN "order" o ON oi.order_id = o.id
      JOIN order_line_item oli ON oi.item_id = oli.id
      WHERE o.customer_id = ? AND oli.product_id = ?
      LIMIT 5
    `, [customerId, product_id])
    debug.orders_with_product = productOrdersResult?.rows || []

    // 4. Check payment collections
    const paymentResult = await pgConnection.raw(`
      SELECT pc.id, pc.status, pc.captured_amount, opc.order_id
      FROM payment_collection pc
      JOIN order_payment_collection opc ON pc.id = opc.payment_collection_id
      JOIN "order" o ON opc.order_id = o.id
      WHERE o.customer_id = ?
      ORDER BY pc.created_at DESC
      LIMIT 10
    `, [customerId])
    debug.payment_collections = paymentResult?.rows || []

    // 5. Check fulfillments with delivered_at
    const fulfillmentResult = await pgConnection.raw(`
      SELECT f.id, f.delivered_at, f.created_at, of.order_id
      FROM fulfillment f
      JOIN order_fulfillment of ON f.id = of.fulfillment_id
      JOIN "order" o ON of.order_id = o.id
      WHERE o.customer_id = ?
      ORDER BY f.created_at DESC
      LIMIT 10
    `, [customerId])
    debug.fulfillments = fulfillmentResult?.rows || []

    // 6. Check existing reviews
    const reviewsResult = await pgConnection.raw(`
      SELECT r.id, r.product_id, r.status, r.created_at
      FROM review r
      WHERE r.customer_id = ? AND r.product_id = ?
    `, [customerId, product_id])
    debug.existing_reviews = reviewsResult?.rows || []

    // 7. Run the fixed eligibility query (matches ReviewsService.canReview)
    // Correct schema: order_item.item_id → order_line_item.id → order_line_item.product_id
    const eligibilityResult = await pgConnection.raw(`
      SELECT DISTINCT o.id as order_id
      FROM "order" o
      JOIN order_item oi ON o.id = oi.order_id
      JOIN order_line_item oli ON oi.item_id = oli.id
      WHERE o.customer_id = ?
        AND oli.product_id = ?
        AND o.status = 'completed'
      LIMIT 1
    `, [customerId, product_id])
    debug.eligibility_query_result = eligibilityResult?.rows || []

    const canReview = (eligibilityResult?.rows?.length || 0) > 0
    const alreadyReviewed = (debug.existing_reviews?.length || 0) > 0

    return res.json({
      can_review: canReview && !alreadyReviewed,
      reason: alreadyReviewed ? "already_reviewed" : (canReview ? null : "no_completed_order"),
      product_id,
      customer_id: customerId,
      debug
    })

  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    })
  }
}
