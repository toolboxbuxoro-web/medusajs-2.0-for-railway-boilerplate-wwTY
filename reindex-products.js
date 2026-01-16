#!/usr/bin/env node

/**
 * Manual script to index all products into Meilisearch
 */

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700'
const MEILISEARCH_KEY = process.env.MEILISEARCH_ADMIN_KEY || 'masterKey'
const BACKEND_URL = 'http://localhost:9000'
const PUBLISHABLE_KEY = 'pk_4b8912eecfd3b215474f932378be4a444bde89b4d8f9e36b0daec25485c51a4a'

async function getAllProducts() {
    console.log('📦 Fetching all products from Medusa store API...')

    let allProducts = []
    let offset = 0
    const limit = 100

    while (true) {
        const res = await fetch(`${BACKEND_URL}/store/products?limit=${limit}&offset=${offset}&fields=*metadata,*variants`, {
            headers: {
                'x-publishable-api-key': PUBLISHABLE_KEY
            }
        })

        if (!res.ok) {
            const error = await res.text()
            throw new Error(`Failed to fetch products: ${res.status} - ${error}`)
        }

        const data = await res.json()
        const products = data.products || []

        if (products.length === 0) break

        allProducts = allProducts.concat(products)
        offset += limit

        console.log(`   Fetched ${allProducts.length} products...`)

        if (products.length < limit) break
    }

    console.log(`✅ Total products: ${allProducts.length}`)
    return allProducts
}

function transformProduct(product) {
    return {
        id: product.id,
        title: product.title,
        subtitle: product.subtitle || null,
        handle: product.handle,
        description: product.description || '',
        thumbnail: product.thumbnail || null,
        status: product.status,
        metadata: product.metadata || {},
        variants: product.variants?.map(v => ({
            id: v.id,
            title: v.title,
            sku: v.sku,
            prices: v.prices
        })) || [],
        brand: product.metadata?.brand || null,
        title_uz: product.metadata?.title_uz || null,
        seo_keywords: product.metadata?.seo_keywords || null,
    }
}

async function indexProducts(products) {
    console.log('\n🔍 Indexing products into Meilisearch...')

    const documents = products.map(transformProduct)

    const res = await fetch(`${MEILISEARCH_HOST}/indexes/products/documents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MEILISEARCH_KEY}`
        },
        body: JSON.stringify(documents)
    })

    if (!res.ok) {
        const error = await res.text()
        throw new Error(`Failed to index: ${error}`)
    }

    const result = await res.json()
    console.log(`✅ Indexing task created:`, result)

    if (result.taskUid) {
        console.log(`\n⏳ Waiting for indexing to complete...`)
        await waitForTask(result.taskUid)
    }
}

async function waitForTask(taskUid) {
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
        const res = await fetch(`${MEILISEARCH_HOST}/tasks/${taskUid}`, {
            headers: { 'Authorization': `Bearer ${MEILISEARCH_KEY}` }
        })

        const task = await res.json()

        if (task.status === 'succeeded') {
            console.log(`\n✅ Indexing completed!`)
            return
        }

        if (task.status === 'failed') {
            console.log(`\n❌ Indexing failed:`, task.error)
            return
        }

        process.stdout.write('.')
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
    }
}

async function verifyIndex() {
    console.log('\n📊 Verifying index...')

    const res = await fetch(`${MEILISEARCH_HOST}/indexes/products/stats`, {
        headers: { 'Authorization': `Bearer ${MEILISEARCH_KEY}` }
    })

    const stats = await res.json()
    console.log(`✅ Index: ${stats.numberOfDocuments} documents`)
}

async function testSearch() {
    console.log('\n🔍 Testing search...')

    const res = await fetch(`${MEILISEARCH_HOST}/indexes/products/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MEILISEARCH_KEY}`
        },
        body: JSON.stringify({ q: '', limit: 3 })
    })

    const results = await res.json()
    console.log(`✅ Sample products:`)
    results.hits?.slice(0, 3).forEach((hit, i) => {
        console.log(`   ${i + 1}. ${hit.title}`)
    })
}

async function main() {
    console.log('🚀 Starting Product Reindexing\n')

    try {
        const products = await getAllProducts()

        if (products.length === 0) {
            console.log('\n⚠️  No products found!')
            return
        }

        await indexProducts(products)
        await verifyIndex()
        await testSearch()

        console.log('\n✅ Done!')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
        process.exit(1)
    }
}

main()
