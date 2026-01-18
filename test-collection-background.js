#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки функциональности цвета фона коллекций
 * 
 * Использование:
 *   node test-collection-background.js
 * 
 * Переменные окружения:
 *   API_URL - URL API (по умолчанию https://api.toolbox-tools.uz)
 *   STOREFRONT_URL - URL Storefront (по умолчанию https://www.toolbox-tools.uz)
 *   PUBLISHABLE_KEY - Publishable API key
 */

const API_URL = process.env.API_URL || 'https://api.toolbox-tools.uz'
const STOREFRONT_URL = process.env.STOREFRONT_URL || 'https://www.toolbox-tools.uz'
const PUBLISHABLE_KEY = process.env.PUBLISHABLE_KEY || 'pk_4b8912eecfd3b215474f932378be4a444bde89b4d8f9e36b0daec25485c51a4a'

async function testCollectionMetadata() {
    console.log('='.repeat(60))
    console.log('🧪 ТЕСТ 1: Проверка metadata коллекций в API')
    console.log('='.repeat(60))

    try {
        const url = `${API_URL}/store/collections?fields=+metadata`
        console.log(`\n📡 Запрос: GET ${url}`)

        const response = await fetch(url, {
            headers: {
                'x-publishable-api-key': PUBLISHABLE_KEY,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            console.log(`❌ Ошибка: ${response.status} ${response.statusText}`)
            return false
        }

        const data = await response.json()
        console.log(`\n✅ Получено ${data.collections?.length || 0} коллекций\n`)

        let hasMetadata = false
        for (const collection of data.collections || []) {
            const metadata = collection.metadata || {}
            const bgColor = metadata.bg_color
            const bgImage = metadata.bg_image
            const textColor = metadata.text_color

            console.log(`📦 ${collection.title} (${collection.handle})`)
            console.log(`   bg_color: ${bgColor || '(не задан)'}`)
            console.log(`   bg_image: ${bgImage || '(не задан)'}`)
            console.log(`   text_color: ${textColor || '(не задан)'}`)
            console.log(`   metadata: ${JSON.stringify(metadata)}`)
            console.log('')

            if (bgColor || bgImage || textColor) {
                hasMetadata = true
            }
        }

        if (hasMetadata) {
            console.log('✅ ТЕСТ 1 ПРОЙДЕН: Metadata с цветами найдены в API')
        } else {
            console.log('⚠️ ТЕСТ 1: Metadata найдены, но цвета не заданы')
        }

        return true
    } catch (error) {
        console.log(`❌ Ошибка: ${error.message}`)
        return false
    }
}

async function testRevalidation() {
    console.log('\n' + '='.repeat(60))
    console.log('🧪 ТЕСТ 2: Проверка Revalidation API')
    console.log('='.repeat(60))

    try {
        const url = `${STOREFRONT_URL}/api/revalidate?tag=collections`
        console.log(`\n📡 Запрос: GET ${url}`)

        const response = await fetch(url)
        const data = await response.json()

        console.log(`\n📋 Ответ:`, JSON.stringify(data, null, 2))

        if (data.success && data.revalidated?.includes('collections')) {
            console.log('\n✅ ТЕСТ 2 ПРОЙДЕН: Revalidation API работает')
            return true
        } else {
            console.log('\n❌ ТЕСТ 2 НЕ ПРОЙДЕН: Revalidation не сработал')
            return false
        }
    } catch (error) {
        console.log(`\n❌ Ошибка: ${error.message}`)
        return false
    }
}

async function testCollectionWithoutMetadataField() {
    console.log('\n' + '='.repeat(60))
    console.log('🧪 ТЕСТ 3: Проверка API без fields=+metadata')
    console.log('='.repeat(60))

    try {
        const url = `${API_URL}/store/collections`
        console.log(`\n📡 Запрос: GET ${url}`)

        const response = await fetch(url, {
            headers: {
                'x-publishable-api-key': PUBLISHABLE_KEY,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            console.log(`❌ Ошибка: ${response.status} ${response.statusText}`)
            return false
        }

        const data = await response.json()
        const firstCollection = data.collections?.[0]

        console.log(`\n📦 Первая коллекция: ${firstCollection?.title}`)
        console.log(`   metadata: ${JSON.stringify(firstCollection?.metadata)}`)

        if (firstCollection?.metadata === undefined || firstCollection?.metadata === null) {
            console.log('\n⚠️ БЕЗ +metadata поле metadata не возвращается!')
            console.log('   Это ожидаемое поведение Medusa API')
        } else {
            console.log('\n✅ Metadata возвращается даже без +metadata поля')
        }

        return true
    } catch (error) {
        console.log(`\n❌ Ошибка: ${error.message}`)
        return false
    }
}

async function testSpecificCollection(handle) {
    console.log('\n' + '='.repeat(60))
    console.log(`🧪 ТЕСТ 4: Проверка конкретной коллекции "${handle}"`)
    console.log('='.repeat(60))

    try {
        const url = `${API_URL}/store/collections?handle=${handle}&fields=+metadata`
        console.log(`\n📡 Запрос: GET ${url}`)

        const response = await fetch(url, {
            headers: {
                'x-publishable-api-key': PUBLISHABLE_KEY,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            console.log(`❌ Ошибка: ${response.status} ${response.statusText}`)
            return false
        }

        const data = await response.json()
        const collection = data.collections?.[0]

        if (!collection) {
            console.log(`❌ Коллекция "${handle}" не найдена`)
            return false
        }

        console.log(`\n📦 Коллекция: ${collection.title}`)
        console.log(`   ID: ${collection.id}`)
        console.log(`   Handle: ${collection.handle}`)
        console.log(`   Metadata:`)
        console.log(JSON.stringify(collection.metadata, null, 4))

        const metadata = collection.metadata || {}
        if (metadata.bg_color) {
            console.log(`\n✅ bg_color установлен: ${metadata.bg_color}`)
        } else {
            console.log('\n⚠️ bg_color НЕ установлен')
        }

        return true
    } catch (error) {
        console.log(`\n❌ Ошибка: ${error.message}`)
        return false
    }
}

async function runAllTests() {
    console.log('\n🔧 ТЕСТИРОВАНИЕ ФУНКЦИИ ЦВЕТА ФОНА КОЛЛЕКЦИЙ\n')
    console.log(`API URL: ${API_URL}`)
    console.log(`Storefront URL: ${STOREFRONT_URL}`)
    console.log(`Publishable Key: ${PUBLISHABLE_KEY.substring(0, 20)}...`)

    const results = []

    // Тест 1: Проверка metadata
    results.push(await testCollectionMetadata())

    // Тест 2: Revalidation
    results.push(await testRevalidation())

    // Тест 3: Без +metadata
    results.push(await testCollectionWithoutMetadataField())

    // Тест 4: Конкретная коллекция (рекомендуемые товары)
    results.push(await testSpecificCollection('recomendyimie-tovari'))

    console.log('\n' + '='.repeat(60))
    console.log('📊 ИТОГИ')
    console.log('='.repeat(60))

    const passed = results.filter(r => r).length
    const total = results.length

    console.log(`\nПройдено: ${passed}/${total}`)

    if (passed === total) {
        console.log('✅ Все тесты пройдены!')
    } else {
        console.log('⚠️ Некоторые тесты не пройдены')
    }

    console.log('\n💡 Советы:')
    console.log('   1. Если metadata пустой - проверьте сохранение в админке')
    console.log('   2. Если revalidation не работает - проверьте CORS')
    console.log('   3. После сохранения вызовите: curl "' + STOREFRONT_URL + '/api/revalidate?tag=collections"')
    console.log('')
}

runAllTests().catch(console.error)
