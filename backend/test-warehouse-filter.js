const https = require('https');
const zlib = require('zlib');

const token = process.env.MOYSKLAD_TOKEN;

if (!token) {
    console.error('❌ Error: MOYSKLAD_TOKEN environment variable is not set.');
    console.error('Usage: MOYSKLAD_TOKEN=your_token node test-warehouse-filter.js');
    process.exit(1);
}

const WAREHOUSE_IDS = [
    'b58e534f-b91d-11ee-0a80-0107003c27c9', // Склад Toolbox 4
    '742f8e44-ed82-11ed-0a80-00cb009f538f', // Toolbox 1 Рай.Маг
    '5b25bcb2-d1d8-11ed-0a80-0e1e0028a95d', // Toolbox 2 Дон Бозори
    '815df250-bce8-11ee-0a80-0f0b001b27f6', // Toolbox 4 Бетонка
];

console.log('🔄 Testing warehouse filtering...');
console.log(`📦 Selected warehouses: ${WAREHOUSE_IDS.length}`);

const req = https.request({
    hostname: 'api.moysklad.ru',
    path: '/api/remap/1.2/report/stock/bystore?limit=5',
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
                console.log(`\n✅ API Response OK. Total products: ${response.meta.size}`);
                console.log(`\n📊 First 5 products with warehouse breakdown:\n`);

                if (response.rows) {
                    response.rows.forEach((product, idx) => {
                        console.log(`${idx + 1}. ${product.name} (SKU: ${product.code || 'N/A'})`);

                        let totalStock = 0;
                        let selectedStock = 0;

                        product.stockByStore.forEach(store => {
                            const storeId = store.meta.href.split('/').pop();
                            const isSelected = WAREHOUSE_IDS.includes(storeId);

                            totalStock += store.stock || 0;
                            if (isSelected) {
                                selectedStock += store.stock || 0;
                                console.log(`   ✓ ${store.name}: ${store.stock} (SELECTED)`);
                            } else {
                                console.log(`   ✗ ${store.name}: ${store.stock}`);
                            }
                        });

                        console.log(`   Total across all warehouses: ${totalStock}`);
                        console.log(`   Total from selected warehouses: ${selectedStock}`);
                        console.log('');
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
