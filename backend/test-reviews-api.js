#!/usr/bin/env node
/**
 * Тестирование модуля отзывов
 * Запуск: node test-reviews-api.js
 */

const BASE_URL = 'http://localhost:9000'

async function testReviewsAPI() {
  console.log('🧪 Тестирование модуля отзывов\n')
  console.log('=' .repeat(50))

  try {
    // 1. Проверка здоровья сервера
    console.log('\n1️⃣ Проверка сервера...')
    const healthRes = await fetch(`${BASE_URL}/health`)
    if (healthRes.ok) {
      console.log('✅ Сервер работает\n')
    } else {
      console.log('❌ Сервер не отвечает')
      return
    }

    // 2. Получение товара
    console.log('2️⃣ Получение товара для тестирования...')
    const productsRes = await fetch(`${BASE_URL}/store/products?limit=1`)
    
    if (!productsRes.ok) {
      console.log(`❌ Ошибка получения товаров: ${productsRes.status}`)
      const errorText = await productsRes.text()
      console.log('Ответ:', errorText.substring(0, 200))
      return
    }

    const productsData = await productsRes.json()
    const products = productsData.products || []
    
    if (products.length === 0) {
      console.log('⚠️  Товары не найдены')
      console.log('   Создайте товар для тестирования модуля отзывов')
      return
    }

    const product = products[0]
    const productId = product.id
    console.log(`✅ Найден товар: "${product.title}"`)
    console.log(`   ID: ${productId}\n`)

    // 3. Тест GET /store/products/:id/reviews
    console.log('3️⃣ Тест: GET /store/products/:id/reviews')
    console.log('   Проверяю endpoint получения отзывов...')
    
    const reviewsRes = await fetch(`${BASE_URL}/store/products/${productId}/reviews`)
    
    if (!reviewsRes.ok) {
      console.log(`❌ Ошибка: ${reviewsRes.status} ${reviewsRes.statusText}`)
      const errorText = await reviewsRes.text()
      console.log('   Ответ:', errorText.substring(0, 200))
      return
    }

    const reviewsData = await reviewsRes.json()
    console.log('✅ Endpoint работает!')
    console.log(`   Отзывов: ${reviewsData.total || 0}`)
    console.log(`   Средний рейтинг: ${reviewsData.average_rating || 0}`)
    console.log(`   Распределение:`, JSON.stringify(reviewsData.distribution || {}))
    console.log()

    // 4. Тест GET /store/products/:id/can-review
    console.log('4️⃣ Тест: GET /store/products/:id/can-review')
    console.log('   Проверяю endpoint проверки возможности оставить отзыв...')
    
    const canReviewRes = await fetch(`${BASE_URL}/store/products/${productId}/can-review`)
    
    if (!canReviewRes.ok) {
      console.log(`❌ Ошибка: ${canReviewRes.status}`)
      return
    }

    const canReviewData = await canReviewRes.json()
    console.log('✅ Endpoint работает!')
    console.log(`   Можно оставить отзыв: ${canReviewData.can_review ? '✅ Да' : '❌ Нет'}`)
    if (canReviewData.reason) {
      const reasons = {
        'auth_required': 'Требуется авторизация',
        'already_reviewed': 'Уже оставлен отзыв',
        'no_completed_order': 'Нет полученного заказа с этим товаром'
      }
      console.log(`   Причина: ${reasons[canReviewData.reason] || canReviewData.reason}`)
    }
    console.log()

    // 5. Проверка структуры ответа
    console.log('5️⃣ Проверка структуры данных...')
    if (reviewsData.reviews && Array.isArray(reviewsData.reviews)) {
      console.log('✅ Структура ответа корректна')
      if (reviewsData.reviews.length > 0) {
        const review = reviewsData.reviews[0]
        console.log('   Пример отзыва:')
        console.log(`   - ID: ${review.id}`)
        console.log(`   - Рейтинг: ${review.rating}/5`)
        console.log(`   - Статус: ${review.status}`)
        if (review.title) console.log(`   - Заголовок: ${review.title}`)
        if (review.pros) console.log(`   - Плюсы: ${review.pros.substring(0, 50)}...`)
        if (review.cons) console.log(`   - Минусы: ${review.cons.substring(0, 50)}...`)
        if (review.images && review.images.length > 0) {
          console.log(`   - Изображений: ${review.images.length}`)
        }
      }
    } else {
      console.log('⚠️  Неожиданная структура ответа')
    }
    console.log()

    // Итоги
    console.log('=' .repeat(50))
    console.log('✅ ВСЕ ОСНОВНЫЕ ENDPOINTS РАБОТАЮТ!')
    console.log()
    console.log('📝 Следующие шаги:')
    console.log('   1. Откройте страницу товара в браузере:')
    console.log(`      http://localhost:8000/products/${productId}`)
    console.log('   2. Прокрутите до секции отзывов')
    console.log('   3. Попробуйте создать отзыв (требует авторизации и полученного товара)')
    console.log('   4. Проверьте модерацию в админ-панели')

  } catch (error) {
    console.error('❌ Ошибка:', error.message)
    if (error.cause) {
      console.error('   Причина:', error.cause.message)
    }
    console.error('\n💡 Убедитесь, что сервер запущен на порту 9000')
  }
}

testReviewsAPI()
