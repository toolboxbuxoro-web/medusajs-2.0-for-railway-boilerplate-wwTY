const { Client } = require('pg');

const client = new Client({
    host: 'metro.proxy.rlwy.net',
    port: 25754,
    user: 'postgres',
    password: 'MVCuwcyVwbOZnthECJZkTNDKlQybrsPO',
    database: 'railway',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
      OFFSET 100
    `);
        console.log(res.rows.map(r => r.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
