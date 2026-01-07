const https = require('https');
const zlib = require('zlib');

const token = process.env.MOYSKLAD_TOKEN;

if (!token) {
    console.error('❌ Error: MOYSKLAD_TOKEN environment variable is not set.');
    console.error('Usage: MOYSKLAD_TOKEN=your_token node list-warehouses.js');
    process.exit(1);
}

console.log('🔄 Fetching warehouses from MoySklad...');

const req = https.request({
    hostname: 'api.moysklad.ru',
    path: '/api/remap/1.2/entity/store',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json;charset=utf-8',
        'Accept-Encoding': 'gzip'
    }
}, (res) => {
    const chunks = [];

    res.on('data', (chunk) => {
        chunks.push(chunk);
    });

    res.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // Decompress if gzipped
        const decompress = res.headers['content-encoding'] === 'gzip'
            ? zlib.gunzipSync(buffer).toString()
            : buffer.toString();

        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                const response = JSON.parse(decompress);
                console.log(`✅ Found ${response.rows ? response.rows.length : 0} warehouses:`);

                if (response.rows) {
                    response.rows.forEach(store => {
                        console.log(`\n📦 Warehouse: ${store.name}`);
                        console.log(`   ID: ${store.id}`);
                        console.log(`   Href: ${store.meta.href}`);
                        console.log(`   Address: ${store.address || 'No address'}`);
                        console.log('---');
                    });
                }
            } catch (e) {
                console.error('❌ Error parsing response:', e);
                console.error('Response:', decompress);
            }
        } else {
            console.error(`❌ API Error: ${res.statusCode}`);
            console.error(decompress);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
});

req.end();
