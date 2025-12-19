import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Lookup Medusa order id for a Payme-paid cart.
 *
 * Storefront Payme return_url only has cart_id (sent as order_id to Payme).
 * After Payme PerformTransaction we persist `medusa_order_id` into the Payme
 * payment session data, and this endpoint exposes it for redirecting to
 * `/order/confirmed/:id`.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cartId = (req.query?.cart_id as string) || ""

  if (!cartId) {
    return res.status(400).json({ error: "cart_id is required" })
  }

  const logger = req.scope.resolve("logger")

  try {
    const pgConnection = req.scope.resolve("__pg_connection__")

    const result = await pgConnection.raw(
      `
      SELECT ps.data
      FROM payment_session ps
      JOIN cart_payment_collection cpc
        ON cpc.payment_collection_id = ps.payment_collection_id
      WHERE cpc.cart_id = ?
        AND ps.provider_id LIKE '%payme%'
      ORDER BY ps.created_at DESC
      LIMIT 1
    `,
      [cartId]
    )

    const rows = result?.rows || result || []
    const row = rows?.[0]

    const sessionData =
      typeof row?.data === "string" ? JSON.parse(row.data) : row?.data || {}

    const orderId = sessionData?.medusa_order_id
    if (orderId) {
      return res.json({ order_id: orderId })
    }

    // Fallback: try to find order by cart_id directly (table name differs across versions).
    // We keep this best-effort and ignore errors.
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
    logger?.error?.(`[store/payme/order] Error: ${e?.message || e}`)
    return res.status(500).json({ error: e?.message || "internal_error" })
  }
}


