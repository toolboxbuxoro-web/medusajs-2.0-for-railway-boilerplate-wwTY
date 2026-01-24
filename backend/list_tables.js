const { Client } = require('pg');

const client = new Client({
    connectionString: "postgresql://postgres:MVCuwcyVwbOZnthECJZkTNDKlQybrsPO@metro.proxy.rlwy.net:25754/railway",
});

async function run() {
    await client.connect();
    console.log("Listing tables");

    const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
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
