/**
 * Standalone reindex script - connects to Railway production
 * Run with: node reindex-to-railway.js
 */

const RAILWAY_DATABASE_URL = "PASTE_YOUR_RAILWAY_DATABASE_URL_HERE"
const RAILWAY_MEILISEARCH_HOST = "PASTE_YOUR_RAILWAY_MEILISEARCH_HOST_HERE"
const RAILWAY_MEILISEARCH_KEY = "PASTE_YOUR_RAILWAY_MEILISEARCH_KEY_HERE"

// Simplified transformer (same logic as backend)
function transformProduct(product) {
    const metadata = product.metadata || {}

    return {
        id: product.id,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        handle: product.handle,
        thumbnail: product.thumbnail,
        status: product.status,
        created_at: product.created_at,
        updated_at: product.updated_at,

        brand: metadata.brand || "",
        title_uz: metadata.title_uz || "",
        seo_keywords: metadata.seo_keywords || "",

        in_stock: metadata.in_stock ?? true,
        price: metadata.price || null,
        sales_count: metadata.sales_count || 0,
        rating_avg: metadata.rating_avg || 0,
        rating_count: metadata.rating_count || 0,

        categories: product.categories?.map(c => ({
            id: c.id,
            title: c.title,
            handle: c.handle
        })) || [],

        variant_sku: product.variants?.[0]?.sku || "",

        variants: product.variants?.map(v => ({
            id: v.id,
            title: v.title,
            sku: v.sku,
            manage_inventory: v.manage_inventory,
            allow_backorder: v.allow_backorder,
            inventory_quantity: v.inventory_quantity,
            calculated_price: v.calculated_price || null
        })) || [],

        metadata: metadata
    }
}

async function reindex() {
    console.log("🚀 Starting reindex to Railway...")

    // 1. Connect to Railway Postgres
    const { Client } = require('pg')
    const client = new Client({ connectionString: RAILWAY_DATABASE_URL })
    await client.connect()
    console.log("✅ Connected to Railway database")

    // 2. Fetch all products
    const result = await client.query(`
    SELECT p.*, 
           json_agg(DISTINCT jsonb_build_object(
             'id', v.id,
             'title', v.title,
             'sku', v.sku,
             'manage_inventory', v.manage_inventory,
             'allow_backorder', v.allow_backorder,
             'inventory_quantity', v.inventory_quantity
           )) FILTER (WHERE v.id IS NOT NULL) as variants,
           json_agg(DISTINCT jsonb_build_object(
             'id', c.id,
             'title', c.name,
             'handle', c.handle
           )) FILTER (WHERE c.id IS NOT NULL) as categories
    FROM product p
    LEFT JOIN product_variant v ON v.product_id = p.id
    LEFT JOIN product_category pc ON pc.product_id = p.id
    LEFT JOIN product_category c ON c.id = pc.product_category_id
    WHERE p.deleted_at IS NULL
    GROUP BY p.id
    LIMIT 5000
  `)

    console.log(`📦 Found ${result.rows.length} products`)

    // 3. Transform products
    const documents = result.rows.map(transformProduct)

    // 4. Send to Meilisearch in batches
    const BATCH_SIZE = 100
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE)

        const res = await fetch(`${RAILWAY_MEILISEARCH_HOST}/indexes/products/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RAILWAY_MEILISEARCH_KEY}`,
            },
            body: JSON.stringify(batch),
        })

        if (!res.ok) {
            console.error(`❌ Batch ${i} failed: ${res.status}`)
        } else {
            console.log(`✅ Indexed ${Math.min(i + BATCH_SIZE, documents.length)}/${documents.length}`)
        }
    }

    await client.end()
    console.log("✨ Reindex complete!")
}

reindex().catch(console.error)
