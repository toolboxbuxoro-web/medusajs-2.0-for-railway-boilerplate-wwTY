#!/usr/bin/env node

/**
 * Bulk sync all products from Medusa to Meilisearch
 * Run: MEILISEARCH_HOST=... MEILISEARCH_ADMIN_KEY=... node sync-all-products.js
 * 
 * For production: set your production Meilisearch and Medusa URLs
 */

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700'
const MEILISEARCH_KEY = process.env.MEILISEARCH_ADMIN_KEY || 'masterKey'
const PUBLISHABLE_KEY = process.env.PUBLISHABLE_KEY || 'pk_4b8912eecfd3b215474f932378be4a444bde89b4d8f9e36b0daec25485c51a4a'

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

        // Flattened for search
        brand: metadata.brand || "",
        title_uz: metadata.title_uz || "",
        seo_keywords: Array.isArray(metadata.seo_keywords)
            ? metadata.seo_keywords.join(" ")
            : metadata.seo_keywords || "",

        // Ranking fields
        in_stock: metadata.in_stock ?? true,
        sales_count: metadata.sales_count || 0,
        rating_avg: metadata.rating_avg || 0,
        rating_count: metadata.rating_count || 0,

        // Categories
        categories: product.categories?.map(c => ({
            id: c.id,
            name: c.name,
            handle: c.handle
        })) || [],

        // Variants
        variants: product.variants?.map(v => ({
            id: v.id,
            title: v.title,
            sku: v.sku
        })) || [],

        // Original metadata
        metadata: metadata
    }
}

async function fetchAllProducts() {
    console.log(`📦 Fetching products from ${MEDUSA_URL}...`)

    let allProducts = []
    let offset = 0
    const limit = 100

    while (true) {
        const res = await fetch(
            `${MEDUSA_URL}/store/products?limit=${limit}&offset=${offset}&fields=*metadata,*variants,*categories`,
            {
                headers: {
                    'x-publishable-api-key': PUBLISHABLE_KEY
                }
            }
        )

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Failed: ${res.status} - ${err}`)
        }

        const data = await res.json()
        const products = data.products || []

        if (products.length === 0) break

        allProducts = allProducts.concat(products)
        offset += limit

        process.stdout.write(`\r   ${allProducts.length} products fetched...`)

        if (products.length < limit) break
    }

    console.log(`\n✅ Total: ${allProducts.length} products`)
    return allProducts
}

async function indexToMeilisearch(products) {
    console.log(`\n🔍 Indexing ${products.length} products to Meilisearch...`)

    const documents = products.map(transformProduct)

    // Batch in chunks of 1000
    const BATCH_SIZE = 1000
    let indexed = 0

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE)

        const res = await fetch(`${MEILISEARCH_HOST}/indexes/products/documents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MEILISEARCH_KEY}`
            },
            body: JSON.stringify(batch)
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Meilisearch error: ${res.status} - ${err}`)
        }

        indexed += batch.length
        process.stdout.write(`\r   ${indexed}/${documents.length} indexed...`)
    }

    console.log(`\n✅ Indexing tasks submitted`)
}

async function verifyIndex() {
    console.log(`\n📊 Verifying index...`)

    const res = await fetch(`${MEILISEARCH_HOST}/indexes/products/stats`, {
        headers: { 'Authorization': `Bearer ${MEILISEARCH_KEY}` }
    })

    const stats = await res.json()
    console.log(`✅ Index contains ${stats.numberOfDocuments} documents`)
}

async function main() {
    console.log('🚀 Bulk Product Sync to Meilisearch\n')
    console.log(`Medusa: ${MEDUSA_URL}`)
    console.log(`Meilisearch: ${MEILISEARCH_HOST}`)
    console.log('─'.repeat(50))

    try {
        const products = await fetchAllProducts()

        if (products.length === 0) {
            console.log('⚠️  No products found!')
            return
        }

        await indexToMeilisearch(products)

        // Wait a bit for indexing
        await new Promise(r => setTimeout(r, 2000))

        await verifyIndex()

        console.log('\n✅ Sync complete!')
    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    }
}

main()
