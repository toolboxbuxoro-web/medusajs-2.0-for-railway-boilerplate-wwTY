// Test the exact endpoint used in sync job
const token = process.argv[2] || 'd3150a2c7dcf1ab7280f02f24e3b2822b0fc3bc4';

async function testStockEndpoint() {
    const warehouseId = 'b58e534f-b91d-11ee-0a80-0107003c27c9'; // Склад Toolbox 4

    const isAccessToken = /^[a-f0-9]+$/i.test(token);
    const authScheme = isAccessToken ? 'Bearer' : 'Basic';

    const headers = {
        "Authorization": `${authScheme} ${token}`,
        "Accept": "application/json;charset=utf-8",
        "Content-Type": "application/json"
    };

    console.log(`Testing with: Authorization: ${authScheme} ${token.substring(0, 5)}...`);
    console.log('');

    // Test 1: Basic assortment endpoint (без stockStore)
    console.log('Test 1: Basic assortment endpoint');
    try {
        const url1 = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?limit=1`;
        const response1 = await fetch(url1, { headers });
        console.log(`Status: ${response1.status} ${response1.statusText}`);
        if (!response1.ok) {
            const error = await response1.text();
            console.log('Error:', error);
        } else {
            console.log('✅ Basic assortment works!');
        }
    } catch (e) {
        console.error('Request failed:', e.message);
    }

    console.log('');

    // Test 2: Assortment with stockStore parameter (как в коде)
    console.log('Test 2: Assortment with stockStore parameter');
    try {
        const url2 = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?limit=1&stockStore=https://api.moysklad.ru/api/remap/1.2/entity/store/${warehouseId}`;
        console.log('URL:', url2);
        const response2 = await fetch(url2, { headers });
        console.log(`Status: ${response2.status} ${response2.statusText}`);
        if (!response2.ok) {
            const error = await response2.text();
            console.log('Error:', error);
        } else {
            console.log('✅ StockStore parameter works!');
        }
    } catch (e) {
        console.error('Request failed:', e.message);
    }
}

testStockEndpoint();
