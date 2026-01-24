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

        console.log('--- API Key ID for pk_efdf... ---');
        const apiKeys = await client.query("SELECT id, title FROM api_key WHERE id = 'apk_01KDPWN3RAYR5D705SBGQM3VZJ'");
        console.log(apiKeys.rows);

        console.log('\n--- Channels linked to this key ---');
        const links = await client.query("SELECT * FROM publishable_api_key_sales_channel WHERE publishable_key_id = 'apk_01KDPWN3RAYR5D705SBGQM3VZJ'");
        console.log(links.rows);

        if (links.rows.length > 0) {
            const channelIds = links.rows.map(r => `'${r.sales_channel_id}'`).join(',');
            console.log('\n--- Sales Channels Details ---');
            const channels = await client.query(`SELECT id, name FROM sales_channel WHERE id IN (${channelIds})`);
            console.log(channels.rows);

            console.log('\n--- Regions linked to these channels ---');
            // In Medusa V2, we might need to find the link between sales_channel and region.
            // Let's check table list for something like sales_channel_region or region link.
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
