const BASE_URL = 'http://localhost:9000';
const ADMIN_EMAIL = 'admin@toolbox.com';
const ADMIN_PASSWORD = 'admin123456';

async function seed() {
    console.log('🚀 Starting demo collection seed...');

    // 1. Authenticate
    console.log('🔑 Authenticating...');

    // Try Medusa v2 Auth first
    let token = null;
    let headers = { 'Content-Type': 'application/json' };

    try {
        const authRes = await fetch(`${BASE_URL}/auth/user/emailpass`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
        });

        if (authRes.ok) {
            const authData = await authRes.json();
            token = authData.access_token || authData.token;
            // cookie might also be needed
            const cookie = authRes.headers.get('set-cookie');
            if (cookie) headers['Cookie'] = cookie;
        } else {
            // Fallback to v1
            console.log('   v2 auth failed, trying v1 /admin/auth...');
            const v1AuthRes = await fetch(`${BASE_URL}/admin/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
            });

            if (v1AuthRes.ok) {
                const v1Data = await v1AuthRes.json();
                token = v1Data.access_token || v1Data.api_token;
                const cookie = v1AuthRes.headers.get('set-cookie');
                if (cookie) headers['Cookie'] = cookie;
            } else {
                console.error('❌ Login failed for both v1 and v2');
                return;
            }
        }
    } catch (e) {
        console.error('❌ Auth error:', e.message);
        return;
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Fetch Products
    console.log('📦 Fetching products...');
    // Medusa v2 admin products
    let products = [];
    try {
        const prodRes = await fetch(`${BASE_URL}/admin/products?limit=10`, { headers });
        if (prodRes.ok) {
            const prodData = await prodRes.json();
            products = prodData.products;
        } else {
            console.error('❌ Failed to fetch products:', await prodRes.text());
            return;
        }
    } catch (e) {
        console.error('❌ Product fetch error:', e.message);
        return;
    }

    if (!products || products.length === 0) {
        console.error('❌ No products found. Please seed products first.');
        return;
    }

    console.log(`✅ Found ${products.length} products.`);

    // 3. Define Collections
    const collections = [
        {
            title: "Зимняя Распродажа",
            handle: "winter-sale-demo",
            metadata: {
                theme: "winter",
                bg_color: "#0c4a6e", // Sky 900
                text_color: "white"
            }
        },
        {
            title: "Яркие Инструменты",
            handle: "bright-tools-demo",
            metadata: {
                bg_color: "#f59e0b", // Amber 500
                text_color: "white"
            }
        },
        {
            title: "Премиум Электроника",
            handle: "premium-tech-demo",
            metadata: {
                bg_color: "#111827", // Gray 900
                text_color: "#ffd700" // Gold
            }
        }
    ];

    // 4. Create Collections and Add Products
    for (let i = 0; i < collections.length; i++) {
        const colData = collections[i];
        console.log(`🔹 Creating collection: ${colData.title}...`);

        // Create
        const createRes = await fetch(`${BASE_URL}/admin/collections`, {
            method: 'POST',
            headers,
            body: JSON.stringify(colData)
        });

        if (!createRes.ok) {
            console.error(`  ❌ Failed to create ${colData.title}:`, await createRes.text());
            continue;
        }

        const { collection } = await createRes.json();
        console.log(`  ✅ Created! ID: ${collection.id}`);

        // Add Products
        const productsToAdd = products.slice(i * 2, (i * 2) + 2).map(p => p.id);

        if (productsToAdd.length > 0) {
            const addProdRes = await fetch(`${BASE_URL}/admin/collections/${collection.id}/products`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ add: productsToAdd }) // v2 often uses { add: [ids] } or { product_ids: [] }
                // Let's try v2 format { add: [id] }
            });

            // If 400 or 404, try v1 structure
            if (!addProdRes.ok) {
                // Retry v1 style
                // POST /admin/collections/:id/products { product_ids: [] } is v1
                const v1AddRes = await fetch(`${BASE_URL}/admin/collections/${collection.id}/products/batch`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ product_ids: productsToAdd })
                });

                if (v1AddRes.ok) {
                    console.log(`    ✅ Added ${productsToAdd.length} products (v1 style).`);
                } else {
                    // Try check if just sending array of IDs works or simple post
                    console.log(`    ⚠️ Could not add products. Creating simple collection only.`);
                }
            } else {
                console.log(`    ✅ Added ${productsToAdd.length} products.`);
            }
        }
    }

    console.log('✨ Done! Please refresh your storefront.');
}

seed();
