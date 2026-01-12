"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
/**
 * Lookup Medusa order id for a Payme-paid cart.
 *
 * Storefront Payme return_url uses order_id param (stored as data->>'order_id' in payment_session).
 * This endpoint looks up the payment session and returns the medusa_order_id after completion.
 */
async function GET(req, res) {
    const cartId = req.query?.cart_id || "";
    if (!cartId) {
        return res.status(400).json({ error: "cart_id is required" });
    }
    const logger = req.scope.resolve("logger");
    try {
        const pgConnection = req.scope.resolve("__pg_connection__");
        // First try: Look by data->>'order_id' (the UUID sent to Payme as order_id)
        // This is how payme-callback sends the ID back from Payme
        let result = await pgConnection.raw(`
      SELECT ps.data
      FROM payment_session ps
      WHERE ps.data->>'order_id' = ?
        AND ps.provider_id LIKE '%payme%'
      ORDER BY ps.created_at DESC
      LIMIT 1
    `, [cartId]);
        let rows = result?.rows || result || [];
        let row = rows?.[0];
        // Second try: Look by cart_id via cart_payment_collection join (legacy/fallback)
        if (!row) {
            result = await pgConnection.raw(`
        SELECT ps.data
        FROM payment_session ps
        JOIN cart_payment_collection cpc
          ON cpc.payment_collection_id = ps.payment_collection_id
        WHERE cpc.cart_id = ?
          AND ps.provider_id LIKE '%payme%'
        ORDER BY ps.created_at DESC
        LIMIT 1
      `, [cartId]);
            rows = result?.rows || result || [];
            row = rows?.[0];
        }
        // Third try: Look by data->>'cart_id' (stored by CreateTransaction)
        if (!row) {
            result = await pgConnection.raw(`
        SELECT ps.data
        FROM payment_session ps
        WHERE ps.data->>'cart_id' = ?
          AND ps.provider_id LIKE '%payme%'
        ORDER BY ps.created_at DESC
        LIMIT 1
      `, [cartId]);
            rows = result?.rows || result || [];
            row = rows?.[0];
        }
        if (row) {
            const sessionData = typeof row?.data === "string" ? JSON.parse(row.data) : row?.data || {};
            const orderId = sessionData?.medusa_order_id;
            if (orderId) {
                return res.json({ order_id: orderId });
            }
        }
        // Final fallback: try to find order by cart_id directly in order table
        const tryQueries = [
            `SELECT id FROM "order" WHERE cart_id = ? LIMIT 1`,
            `SELECT id FROM orders WHERE cart_id = ? LIMIT 1`,
        ];
        for (const q of tryQueries) {
            try {
                const r = await pgConnection.raw(q, [cartId]);
                const rr = r?.rows || r || [];
                const found = rr?.[0]?.id;
                if (found) {
                    return res.json({ order_id: found });
                }
            }
            catch {
                // ignore
            }
        }
        return res.status(404).json({ error: "order_not_ready" });
    }
    catch (e) {
        logger?.error?.(`[store/payme/order] Error: ${e?.message || e}`);
        return res.status(500).json({ error: e?.message || "internal_error" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3BheW1lL29yZGVyL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsa0JBcUdDO0FBM0dEOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sTUFBTSxHQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBa0IsSUFBSSxFQUFFLENBQUE7SUFFbkQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ1osT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUE7SUFDL0QsQ0FBQztJQUVELE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0lBRTFDLElBQUksQ0FBQztRQUNILE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUE7UUFFM0QsNEVBQTRFO1FBQzVFLDBEQUEwRDtRQUMxRCxJQUFJLE1BQU0sR0FBRyxNQUFNLFlBQVksQ0FBQyxHQUFHLENBQ2pDOzs7Ozs7O0tBT0QsRUFDQyxDQUFDLE1BQU0sQ0FBQyxDQUNULENBQUE7UUFFRCxJQUFJLElBQUksR0FBRyxNQUFNLEVBQUUsSUFBSSxJQUFJLE1BQU0sSUFBSSxFQUFFLENBQUE7UUFDdkMsSUFBSSxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFbkIsaUZBQWlGO1FBQ2pGLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUNULE1BQU0sR0FBRyxNQUFNLFlBQVksQ0FBQyxHQUFHLENBQzdCOzs7Ozs7Ozs7T0FTRCxFQUNDLENBQUMsTUFBTSxDQUFDLENBQ1QsQ0FBQTtZQUVELElBQUksR0FBRyxNQUFNLEVBQUUsSUFBSSxJQUFJLE1BQU0sSUFBSSxFQUFFLENBQUE7WUFDbkMsR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2pCLENBQUM7UUFFRCxvRUFBb0U7UUFDcEUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ1QsTUFBTSxHQUFHLE1BQU0sWUFBWSxDQUFDLEdBQUcsQ0FDN0I7Ozs7Ozs7T0FPRCxFQUNDLENBQUMsTUFBTSxDQUFDLENBQ1QsQ0FBQTtZQUVELElBQUksR0FBRyxNQUFNLEVBQUUsSUFBSSxJQUFJLE1BQU0sSUFBSSxFQUFFLENBQUE7WUFDbkMsR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ2pCLENBQUM7UUFFRCxJQUFJLEdBQUcsRUFBRSxDQUFDO1lBQ1IsTUFBTSxXQUFXLEdBQ2YsT0FBTyxHQUFHLEVBQUUsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFBO1lBRXhFLE1BQU0sT0FBTyxHQUFHLFdBQVcsRUFBRSxlQUFlLENBQUE7WUFDNUMsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDWixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtZQUN4QyxDQUFDO1FBQ0gsQ0FBQztRQUVELHVFQUF1RTtRQUN2RSxNQUFNLFVBQVUsR0FBRztZQUNqQixrREFBa0Q7WUFDbEQsaURBQWlEO1NBQ2xELENBQUE7UUFFRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQzNCLElBQUksQ0FBQztnQkFDSCxNQUFNLENBQUMsR0FBRyxNQUFNLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtnQkFDN0MsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO2dCQUM3QixNQUFNLEtBQUssR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUE7Z0JBQ3pCLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1YsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7Z0JBQ3RDLENBQUM7WUFDSCxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUNQLFNBQVM7WUFDWCxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFBO0lBQzNELENBQUM7SUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1FBQ2hCLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyw4QkFBOEIsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ2hFLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sSUFBSSxnQkFBZ0IsRUFBRSxDQUFDLENBQUE7SUFDeEUsQ0FBQztBQUNILENBQUMifQ==