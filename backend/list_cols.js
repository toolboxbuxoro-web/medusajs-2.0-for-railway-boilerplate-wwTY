const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:MVCuwcyVwbOZnthECJZkTNDKlQybrsPO@metro.proxy.rlwy.net:25754/railway",
});

async function run() {
    await client.connect();
    const table = process.argv[2] || 'order';
    console.log(`Listing columns for table: ${table}`);

    const query = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = '${table}'
    ORDER BY ordinal_position;
  `;

    try {
        const res = await client.query(query);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
