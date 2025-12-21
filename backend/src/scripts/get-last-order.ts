import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: "postgres://postgres:postgres@localhost:5432/medusa"
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, display_id FROM "order" ORDER BY created_at DESC LIMIT 1');
    if (res.rows.length > 0) {
      console.log(`LATEST_ORDER_ID=${res.rows[0].id}`);
      console.log(`DISPLAY_ID=${res.rows[0].display_id}`);
    } else {
      console.log('No orders found.');
    }
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await client.end();
  }
}

main();
