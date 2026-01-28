#!/usr/bin/env node

/**
 * Скрипт для получения списка типов цен из МойСклад
 */

async function listPriceTypes() {
    const token = process.env.MOYSKLAD_TOKEN

    if (!token) {
        console.error('❌ MOYSKLAD_TOKEN не установлен!')
        console.log('\n💡 Укажите токен:')
        console.log('   MOYSKLAD_TOKEN=ваш_токен node list-price-types.js')
        process.exit(1)
    }

    const isAccessToken = /^[a-f0-9]+$/i.test(token)
    const authScheme = isAccessToken ? 'Bearer' : 'Basic'

    const headers = {
        "Authorization": `${authScheme} ${token}`,
        "Accept": "application/json;charset=utf-8",
        "Content-Type": "application/json"
    }

    console.log('🔍 Получение списка типов цен из МойСклад...\n')

    try {
        // Получаем типы цен
        const url = 'https://api.moysklad.ru/api/remap/1.2/context/companysettings/pricetype'

        const response = await fetch(url, { headers })

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        console.log(`📋 Найдено ${data.length} типов цен:\n`)

        data.forEach((priceType, index) => {
            console.log(`${index + 1}. ${priceType.name}`)
            console.log(`   ID: ${priceType.id}`)
            console.log(`   External Code: ${priceType.externalCode || 'нет'}`)
            console.log()
        })

        // Теперь получим пример товара с ценами
        console.log('='.repeat(80))
        console.log('\n📦 Пример товара с ценами:\n')

        const assortmentUrl = 'https://api.moysklad.ru/api/remap/1.2/entity/assortment?limit=1'
        const assortmentResponse = await fetch(assortmentUrl, { headers })
        const assortmentData = await assortmentResponse.json()

        if (assortmentData.rows && assortmentData.rows.length > 0) {
            const product = assortmentData.rows[0]
            console.log(`Товар: ${product.name}`)
            console.log(`SKU: ${product.code || 'нет'}`)
            console.log(`\nЦены:`)

            if (product.salePrices && Array.isArray(product.salePrices)) {
                product.salePrices.forEach(price => {
                    const priceInSum = price.value / 100 // МойСклад возвращает в минимальных единицах
                    console.log(`  - ${price.priceType?.name || 'Без типа'}: ${priceInSum.toLocaleString('ru-RU')} ${price.currency?.name || 'UZS'}`)
                })
            } else {
                console.log('  ⚠️ Нет цен для этого товара')
            }

            console.log('\n📊 Полная структура salePrices:')
            console.log(JSON.stringify(product.salePrices, null, 2))
        }

    } catch (error) {
        console.error('❌ Ошибка:', error.message)
        if (error.stack) {
            console.error(error.stack)
        }
    }
}

listPriceTypes()
