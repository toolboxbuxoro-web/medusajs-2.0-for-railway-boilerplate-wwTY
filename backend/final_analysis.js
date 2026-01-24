const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:MVCuwcyVwbOZnthECJZkTNDKlQybrsPO@metro.proxy.rlwy.net:25754/railway",
});

async function run() {
    await client.connect();
    console.log("Connected to DB for high-level analysis");

    const query = `
    SELECT 
      o.id as order_id,
      o.display_id,
      o.status as order_status,
      f.shipped_at,
      f.delivered_at,
      p.captured_at,
      oi.quantity,
      oi.fulfilled_quantity,
      oi.shipped_quantity,
      oi.delivered_quantity,
      oli.title as product_title
    FROM "order" o
    LEFT JOIN order_fulfillment ofl ON o.id = ofl.order_id
    LEFT JOIN fulfillment f ON ofl.fulfillment_id = f.id
    LEFT JOIN order_payment_collection opc ON o.id = opc.order_id
    LEFT JOIN payment p ON p.payment_collection_id = opc.payment_collection_id
    LEFT JOIN order_item oi ON o.id = oi.order_id
    LEFT JOIN order_line_item oli ON oi.item_id = oli.id
    ORDER BY o.created_at DESC
    LIMIT 15;
  `;

    try {
        const res = await client.query(query);
        console.log("--- DATA DUMP START ---");
        console.log(JSON.stringify(res.rows, null, 2));
        console.log("--- DATA DUMP END ---");
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
