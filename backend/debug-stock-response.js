const https = require('https');
const zlib = require('zlib');

const token = process.env.MOYSKLAD_TOKEN;

if (!token) {
    console.error('❌ Error: MOYSKLAD_TOKEN environment variable is not set.');
    console.error('Usage: MOYSKLAD_TOKEN=your_token node debug-stock-response.js');
    process.exit(1);
}

console.log('🔄 Fetching stock data to debug response structure...');

const req = https.request({
    hostname: 'api.moysklad.ru',
    path: '/api/remap/1.2/report/stock/bystore?limit=3',
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

        const decompress = res.headers['content-encoding'] === 'gzip'
            ? zlib.gunzipSync(buffer).toString()
            : buffer.toString();

        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                const response = JSON.parse(decompress);
                console.log('\n✅ API Response OK\n');
                console.log('📊 First 3 products structure:\n');

                response.rows.slice(0, 3).forEach((product, idx) => {
                    console.log(`\n=== Product ${idx + 1} ===`);
                    console.log('Available fields:', Object.keys(product));
                    console.log('Full product data:');
                    console.log(JSON.stringify(product, null, 2));
                });
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
