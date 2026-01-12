const https = require('https');
const zlib = require('zlib');

const token = process.env.MOYSKLAD_TOKEN;

if (!token) {
    console.error('❌ Error: MOYSKLAD_TOKEN environment variable is not set.');
    process.exit(1);
}

console.log('🔄 Testing stock/bystore with expand parameter...');

// Try with expand to get product details
const req = https.request({
    hostname: 'api.moysklad.ru',
    path: '/api/remap/1.2/report/stock/bystore?limit=2&expand=product',
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
                console.log('\n✅ API Response with expand=product:\n');
                console.log(JSON.stringify(response.rows[0], null, 2));
            } catch (e) {
                console.error('❌ Error parsing response:', e);
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
