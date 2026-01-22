import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/customer/reviews
 * Returns customer's reviews and review statuses for their order items
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ error: "Authentication required" })
  }

  try {
    const pgConnection = req.scope.resolve("__pg_connection__")

    // Get all reviews by this customer
    const reviewsResult = await pgConnection.raw(`
      SELECT 
        r.id,
        r.product_id,
        r.order_id,
        r.rating,
        r.comment,
        r.pros,
        r.cons,
        r.images,
        r.status,
        r.rejection_reason,
        r.created_at
      FROM review r
      WHERE r.customer_id = ?
      ORDER BY r.created_at DESC
    `, [customerId])

    const reviews = reviewsResult?.rows || []

    // Create a map of product_id -> review for quick lookup
    const reviewsByProduct: Record<string, any> = {}
    for (const review of reviews) {
      if (!reviewsByProduct[review.product_id]) {
        reviewsByProduct[review.product_id] = review
      }
    }

    // Get all order items for this customer's orders (paid orders only)
    const orderItemsResult = await pgConnection.raw(`
      SELECT DISTINCT
        oi.id as item_id,
        oi.order_id,
        pv.product_id,
        oi.title as item_title,
        oi.thumbnail,
        oi.variant_id,
        o.display_id as order_display_id,
        o.created_at as order_date
      FROM order_item oi
      JOIN "order" o ON oi.order_id = o.id
      JOIN product_variant pv ON oi.variant_id = pv.id
      JOIN order_payment_collection opc ON o.id = opc.order_id
      JOIN payment_collection pc ON opc.payment_collection_id = pc.id
      WHERE o.customer_id = ?
        AND o.status != 'canceled'
        AND (pc.captured_amount > 0 OR pc.status IN ('captured', 'completed'))
      ORDER BY o.created_at DESC
    `, [customerId])

    const orderItems = orderItemsResult?.rows || []

    // Enrich order items with review status
    const itemsWithReviewStatus = orderItems.map((item: any) => {
      const review = reviewsByProduct[item.product_id]
      return {
        ...item,
        review_status: review ? review.status : "none",
        review_id: review?.id || null,
        review: review || null
      }
    })

    // Separate into pending reviews (no review) and submitted reviews
    const pendingItems = itemsWithReviewStatus.filter((i: any) => i.review_status === "none")
    const submittedReviews = reviews

    res.json({
      pending_items: pendingItems,
      reviews: submittedReviews,
      reviews_by_product: reviewsByProduct
    })

  } catch (error: any) {
    console.error("[GET /store/customer/reviews] Error:", error)
    res.status(500).json({ error: "Failed to fetch reviews" })
  }
}
