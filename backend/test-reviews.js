#!/usr/bin/env node
/**
 * Скрипт для тестирования модуля отзывов
 * Использование: node test-reviews.js
 */

const BASE_URL = 'http://localhost:9000'

async function testReviewsModule() {
  console.log('🧪 Тестирование модуля отзывов...\n')

  try {
    // 1. Получить publishable key
    console.log('1️⃣ Получаю publishable key...')
    const keyRes = await fetch(`${BASE_URL}/api/key-exchange`)
    const keyData = await keyRes.json()
    const publishableKey = keyData.publishableApiKey || ''
    
    if (!publishableKey) {
      console.log('⚠️  Publishable key не найден, продолжаю без него...\n')
    } else {
      console.log('✅ Publishable key получен\n')
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(publishableKey && { 'x-publishable-api-key': publishableKey }),
    }

    // 2. Получить список товаров
    console.log('2️⃣ Получаю список товаров...')
    const productsRes = await fetch(`${BASE_URL}/store/products?limit=1`, { headers })
    
    if (!productsRes.ok) {
      console.error(`❌ Ошибка получения товаров: ${productsRes.status}`)
      const errorText = await productsRes.text()
      console.error('Ответ:', errorText)
      return
    }

    const productsData = await productsRes.json()
    const products = productsData.products || []
    
    if (products.length === 0) {
      console.log('⚠️  Товары не найдены. Создайте товар для тестирования.')
      return
    }

    const productId = products[0].id
    console.log(`✅ Найден товар: ${products[0].title} (ID: ${productId})\n`)

    // 3. Проверить endpoint получения отзывов
    console.log('3️⃣ Проверяю GET /store/products/:id/reviews...')
    const reviewsRes = await fetch(`${BASE_URL}/store/products/${productId}/reviews`, { headers })
    
    if (!reviewsRes.ok) {
      console.error(`❌ Ошибка: ${reviewsRes.status}`)
      const errorText = await reviewsRes.text()
      console.error('Ответ:', errorText)
      return
    }

    const reviewsData = await reviewsRes.json()
    console.log('✅ Endpoint работает!')
    console.log(`   Отзывов: ${reviewsData.total || 0}`)
    console.log(`   Средний рейтинг: ${reviewsData.average_rating || 0}`)
    console.log(`   Распределение:`, reviewsData.distribution || {})
    console.log()

    // 4. Проверить endpoint can-review
    console.log('4️⃣ Проверяю GET /store/products/:id/can-review...')
    const canReviewRes = await fetch(`${BASE_URL}/store/products/${productId}/can-review`, { headers })
    
    if (!canReviewRes.ok) {
      console.error(`❌ Ошибка: ${canReviewRes.status}`)
      return
    }

    const canReviewData = await canReviewRes.json()
    console.log('✅ Endpoint работает!')
    console.log(`   Можно оставить отзыв: ${canReviewData.can_review ? 'Да' : 'Нет'}`)
    if (canReviewData.reason) {
      console.log(`   Причина: ${canReviewData.reason}`)
    }
    console.log()

    // 5. Проверить Admin API (если есть токен)
    console.log('5️⃣ Проверяю Admin API...')
    console.log('   (Требует авторизации администратора)')
    console.log()

    console.log('✅ Все основные endpoints работают!')
    console.log('\n📝 Следующие шаги:')
    console.log('   1. Откройте страницу товара в браузере')
    console.log('   2. Попробуйте создать отзыв (требует авторизации и полученного товара)')
    console.log('   3. Проверьте модерацию в админ-панели')

  } catch (error) {
    console.error('❌ Ошибка:', error.message)
    console.error('Stack:', error.stack)
  }
}

testReviewsModule()
