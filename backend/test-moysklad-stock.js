#!/usr/bin/env node

/**
 * Тестовый скрипт для проверки данных MoySklad API
 * Проверяет остатки конкретного товара на всех 4 складах
 */

const WAREHOUSE_IDS = [
    'b58e534f-b91d-11ee-0a80-0107003c27c9', // Склад Toolbox 4
    '742f8e44-ed82-11ed-0a80-00cb009f538f', // Toolbox 1 Рай.Маг
    '5b25bcb2-d1d8-11ed-0a80-0e1e0028a95d', // Toolbox 2 Дон Бозори
    '815df250-bce8-11ee-0a80-0f0b001b27f6', // Toolbox 4 Бетонка
]

const WAREHOUSE_NAMES = {
    'b58e534f-b91d-11ee-0a80-0107003c27c9': 'Склад Toolbox 4',
    '742f8e44-ed82-11ed-0a80-00cb009f538f': 'Toolbox 1 Рай.Маг',
    '5b25bcb2-d1d8-11ed-0a80-0e1e0028a95d': 'Toolbox 2 Дон Бозори',
    '815df250-bce8-11ee-0a80-0f0b001b27f6': 'Toolbox 4 Бетонка',
}

async function testStockAPI() {
    const token = process.env.MOYSKLAD_TOKEN

    if (!token) {
        console.error('❌ MOYSKLAD_TOKEN не установлен!')
        process.exit(1)
    }

    const isAccessToken = /^[a-f0-9]+$/i.test(token)
    const authScheme = isAccessToken ? 'Bearer' : 'Basic'

    const headers = {
        "Authorization": `${authScheme} ${token}`,
        "Accept": "application/json;charset=utf-8",
        "Content-Type": "application/json"
    }

    console.log('🔍 Тестирование MoySklad API для получения остатков...\n')

    // Получаем первый товар для теста
    const url = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?limit=1`

    try {
        const response = await fetch(url, { headers })
        const data = await response.json()

        if (!data.rows || data.rows.length === 0) {
            console.error('❌ Товары не найдены')
            return
        }

        const testProduct = data.rows[0]
        console.log(`📦 Тестовый товар: ${testProduct.name}`)
        console.log(`   SKU: ${testProduct.code || 'нет'}`)
        console.log(`   Артикул: ${testProduct.article || 'нет'}`)
        console.log('\n' + '='.repeat(80) + '\n')

        // Проверяем данные с каждого склада
        let totalStock = 0
        let totalQuantity = 0
        let totalReserve = 0

        for (const warehouseId of WAREHOUSE_IDS) {
            const warehouseName = WAREHOUSE_NAMES[warehouseId]
            console.log(`🏢 ${warehouseName}`)

            const warehouseUrl = `https://api.moysklad.ru/api/remap/1.2/entity/assortment?limit=5&stockStore=https://api.moysklad.ru/api/remap/1.2/entity/store/${warehouseId}&filter=code=${encodeURIComponent(testProduct.code)}`

            const warehouseResponse = await fetch(warehouseUrl, { headers })
            const warehouseData = await warehouseResponse.json()

            if (warehouseData.rows && warehouseData.rows.length > 0) {
                const product = warehouseData.rows[0]

                console.log(`   📊 Данные из API:`)
                console.log(`      - stock: ${product.stock || 0}`)
                console.log(`      - quantity: ${product.quantity || 0}`)
                console.log(`      - reserve: ${product.reserve || 0}`)
                console.log(`      - inTransit: ${product.inTransit || 0}`)

                totalStock += (product.stock || 0)
                totalQuantity += (product.quantity || 0)
                totalReserve += (product.reserve || 0)
            } else {
                console.log(`   ⚠️ Товар не найден на этом складе`)
            }

            console.log()

            // Небольшая задержка между запросами
            await new Promise(resolve => setTimeout(resolve, 200))
        }

        console.log('='.repeat(80))
        console.log('\n📊 ИТОГО ПО ВСЕМ 4 СКЛАДАМ:')
        console.log(`   Total stock (текущий код использует это): ${totalStock}`)
        console.log(`   Total quantity: ${totalQuantity}`)
        console.log(`   Total reserve: ${totalReserve}`)
        console.log(`   Available (stock - reserve): ${totalStock - totalReserve}`)

        console.log('\n💡 ПРОБЛЕМА:')
        console.log(`   Текущий код суммирует поле "stock"`)
        console.log(`   Возможно, нужно использовать "quantity" или другой метод расчёта`)

        // Теперь проверим альтернативный метод через /report/stock/bystore
        console.log('\n' + '='.repeat(80))
        console.log('\n🔬 Проверяем альтернативный API: /report/stock/bystore\n')

        const reportUrl = `https://api.moysklad.ru/api/remap/1.2/report/stock/bystore?limit=1`
        const reportResponse = await fetch(reportUrl, { headers })
        const reportData = await reportResponse.json()

        if (reportData.rows && reportData.rows.length > 0) {
            const reportProduct = reportData.rows[0]
            console.log(`📦 Товар: ${reportProduct.name}`)
            console.log(`   SKU: ${reportProduct.code || 'нет'}`)
            console.log(`\n   Остатки по складам:`)

            if (reportProduct.stockByStore && Array.isArray(reportProduct.stockByStore)) {
                reportProduct.stockByStore.forEach(storeStock => {
                    console.log(`   - ${storeStock.name}: ${storeStock.stock} (резерв: ${storeStock.reserve})`)
                })
            }
        }

    } catch (error) {
        console.error('❌ Ошибка:', error.message)
    }
}

testStockAPI()
