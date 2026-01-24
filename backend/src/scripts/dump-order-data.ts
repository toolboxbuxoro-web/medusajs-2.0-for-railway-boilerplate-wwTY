import { ExecArgs } from "@medusajs/framework/types"

export default async function analyzeOrderData({ container }: ExecArgs) {
  const pgConnection = container.resolve("pg_connection")

  // Fetch recent orders with items and line items
  const query = `
    SELECT 
      o.id as order_id,
      o.display_id,
      o.status as order_status,
      o.fulfillment_status,
      o.payment_status,
      oi.shipped_quantity,
      oi.fulfilled_quantity,
      oli.id as line_item_id,
      oli.product_id,
      oli.title as product_title
    FROM "order" o
    LEFT JOIN order_item oi ON o.id = oi.order_id
    LEFT JOIN order_line_item oli ON oi.item_id = oli.id
    ORDER BY o.created_at DESC
    LIMIT 20;
  `

  try {
    const result = await pgConnection.raw(query)
    console.log("--- DATA DUMP START ---")
    console.log(JSON.stringify(result.rows, null, 2))
    console.log("--- DATA DUMP END ---")
  } catch (error) {
    console.error("Error fetching data:", error)
  }
}
