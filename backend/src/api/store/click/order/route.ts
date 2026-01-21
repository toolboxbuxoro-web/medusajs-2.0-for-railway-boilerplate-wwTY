import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Lookup Medusa order id for a Click-paid cart.
 *
 * Storefront Click return_url does not receive order id directly.
 * We store cart_id in payment_session.data and resolve medusa_order_id here,
 * so the storefront can redirect the customer to /order/confirmed/:id
 * after successful payment.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cartId = (req.query?.cart_id as string) || ""

  if (!cartId) {
    return res.status(400).json({ error: "cart_id is required" })
  }

  const logger = req.scope.resolve("logger")

  try {
    const pgConnection = req.scope.resolve("__pg_connection__")

    // First try: Look by data->>'cart_id' (stored by Click prepare handler)
    let result = await pgConnection.raw(
      `
      SELECT ps.data
      FROM payment_session ps
      WHERE ps.data->>'cart_id' = ?
        AND ps.provider_id LIKE '%click%'
      ORDER BY ps.created_at DESC
      LIMIT 1
    `,
      [cartId]
    )

    let rows = result?.rows || result || []
    let row = rows?.[0]

    // Second try: Look by cart_id via cart_payment_collection join (fallback)
    if (!row) {
      result = await pgConnection.raw(
        `
        SELECT ps.data
        FROM payment_session ps
        JOIN cart_payment_collection cpc
          ON cpc.payment_collection_id = ps.payment_collection_id
        WHERE cpc.cart_id = ?
          AND ps.provider_id LIKE '%click%'
        ORDER BY ps.created_at DESC
        LIMIT 1
      `,
        [cartId]
      )

      rows = result?.rows || result || []
      row = rows?.[0]
    }

    if (row) {
      const sessionData =
        typeof row?.data === "string" ? JSON.parse(row.data) : row?.data || {}

      const orderId = sessionData?.medusa_order_id
      if (orderId) {
        return res.json({ order_id: orderId })
      }
    }

    // Final fallback: try to find order by cart_id directly in order table
    const tryQueries = [
      `SELECT id FROM "order" WHERE cart_id = ? LIMIT 1`,
      `SELECT id FROM orders WHERE cart_id = ? LIMIT 1`,
    ]

    for (const q of tryQueries) {
      try {
        const r = await pgConnection.raw(q, [cartId])
        const rr = r?.rows || r || []
        const found = rr?.[0]?.id
        if (found) {
          return res.json({ order_id: found })
        }
      } catch {
        // ignore
      }
    }

    return res.status(404).json({ error: "order_not_ready" })
  } catch (e: any) {
    logger?.error?.(`[store/click/order] Error: ${e?.message || e}`)
    return res.status(500).json({ error: e?.message || "internal_error" })
  }
}

