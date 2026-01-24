const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:MVCuwcyVwbOZnthECJZkTNDKlQybrsPO@metro.proxy.rlwy.net:25754/railway",
});

async function run() {
    await client.connect();
    console.log("Connected to DB");

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
    LIMIT 10;
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
