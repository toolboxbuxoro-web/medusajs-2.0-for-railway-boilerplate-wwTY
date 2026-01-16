#!/usr/bin/env node

/**
 * Test script for search functionality
 * Tests both Meilisearch directly and backend /store/search endpoint
 */

const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://localhost:7700'
const MEILISEARCH_KEY = process.env.MEILISEARCH_ADMIN_KEY || 'masterKey'
const BACKEND_URL = 'http://localhost:9000'

async function testMeilisearch() {
    console.log('\n🔍 Testing Meilisearch directly...')
    console.log(`Host: ${MEILISEARCH_HOST}`)

    try {
        // Test health
        const healthRes = await fetch(`${MEILISEARCH_HOST}/health`)
        const health = await healthRes.json()
        console.log('✅ Meilisearch health:', health)

        // Test search
        const searchRes = await fetch(`${MEILISEARCH_HOST}/indexes/products/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MEILISEARCH_KEY}`
            },
            body: JSON.stringify({
                q: 'interskol',
                limit: 5
            })
        })

        if (!searchRes.ok) {
            const error = await searchRes.text()
            console.log('❌ Meilisearch search error:', searchRes.status, error)
            return false
        }

        const searchData = await searchRes.json()
        console.log(`✅ Meilisearch search results: ${searchData.hits?.length || 0} hits`)
        console.log('First hit:', searchData.hits?.[0]?.title || 'N/A')
        return true
    } catch (error) {
        console.log('❌ Meilisearch error:', error.message)
        return false
    }
}

async function testBackendSearch() {
    console.log('\n🔍 Testing Backend /store/search...')
    console.log(`URL: ${BACKEND_URL}/store/search`)

    try {
        const res = await fetch(`${BACKEND_URL}/store/search?q=interskol&limit=5`)

        if (!res.ok) {
            const error = await res.text()
            console.log('❌ Backend search error:', res.status, error)
            return false
        }

        const data = await res.json()
        console.log(`✅ Backend search results:`)
        console.log(`   - Hits: ${data.hits?.length || 0}`)
        console.log(`   - Total: ${data.estimatedTotalHits || 0}`)
        console.log(`   - Mode: ${data.mode || 'N/A'}`)
        console.log(`   - Query: "${data.query}"`)

        if (data.hits && data.hits.length > 0) {
            console.log(`   - First product: ${data.hits[0].title || 'N/A'}`)
        }

        return true
    } catch (error) {
        console.log('❌ Backend search error:', error.message)
        return false
    }
}

async function testEmptyQuery() {
    console.log('\n🔍 Testing empty query (recommendations)...')

    try {
        const res = await fetch(`${BACKEND_URL}/store/search?q=&limit=5`)
        const data = await res.json()

        console.log(`✅ Recommendations:`)
        console.log(`   - Hits: ${data.hits?.length || 0}`)
        console.log(`   - Mode: ${data.mode || 'N/A'}`)

        return true
    } catch (error) {
        console.log('❌ Recommendations error:', error.message)
        return false
    }
}

async function main() {
    console.log('🚀 Starting Search Tests\n')
    console.log('='.repeat(50))

    const meiliOk = await testMeilisearch()
    const backendOk = await testBackendSearch()
    const recsOk = await testEmptyQuery()

    console.log('\n' + '='.repeat(50))
    console.log('\n📊 Test Summary:')
    console.log(`   Meilisearch: ${meiliOk ? '✅' : '❌'}`)
    console.log(`   Backend API: ${backendOk ? '✅' : '❌'}`)
    console.log(`   Recommendations: ${recsOk ? '✅' : '❌'}`)

    if (!meiliOk) {
        console.log('\n💡 Meilisearch might not be running or configured.')
        console.log('   Check MEILISEARCH_HOST and MEILISEARCH_ADMIN_KEY in backend/.env')
    }

    if (!backendOk) {
        console.log('\n💡 Backend search endpoint has issues.')
        console.log('   Check backend logs for errors.')
    }
}

main().catch(console.error)
