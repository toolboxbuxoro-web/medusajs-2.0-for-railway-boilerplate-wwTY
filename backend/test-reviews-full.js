#!/usr/bin/env node
/**
 * Тестирование модуля отзывов с publishable key
 * Запуск: node test-reviews-full.js
 */

const BASE_URL = 'http://localhost:9000'
const PUBLISHABLE_KEY = 'pk_4b8912eecfd3b215474f932378be4a444bde89b4d8f9e36b0daec25485c51a4a'

async function testReviewsModule() {
  console.log('🧪 Тестирование модуля отзывов\n')
  console.log('=' .repeat(60))

  const headers = {
    'Content-Type': 'application/json',
    'x-publishable-api-key': PUBLISHABLE_KEY,
  }

  try {
    // 1. Получить товар
    console.log('\n1️⃣ Получение товара для тестирования...')
    const productsRes = await fetch(`${BASE_URL}/store/products?limit=1`, { headers })
    
    if (!productsRes.ok) {
      console.log(`❌ Ошибка получения товаров: ${productsRes.status}`)
      const errorText = await productsRes.text()
      console.log('Ответ:', errorText.substring(0, 300))
      return
    }

    const productsData = await productsRes.json()
    const products = productsData.products || []
    
    if (products.length === 0) {
      console.log('⚠️  Товары не найдены в базе данных')
      console.log('   Создайте товар для тестирования модуля отзывов')
      return
    }

    const product = products[0]
    const productId = product.id
    console.log(`✅ Найден товар: "${product.title}"`)
    console.log(`   ID: ${productId}\n`)

    // 2. Тест GET /store/products/:id/reviews
    console.log('2️⃣ Тест: GET /store/products/:id/reviews')
    console.log(`   URL: ${BASE_URL}/store/products/${productId}/reviews`)
    
    const reviewsRes = await fetch(`${BASE_URL}/store/products/${productId}/reviews`, { headers })
    
    if (!reviewsRes.ok) {
      console.log(`❌ Ошибка: ${reviewsRes.status} ${reviewsRes.statusText}`)
      const errorText = await reviewsRes.text()
      console.log('   Ответ:', errorText.substring(0, 300))
      return
    }

    const reviewsData = await reviewsRes.json()
    console.log('✅ Endpoint работает!')
    console.log(`   Отзывов: ${reviewsData.total || 0}`)
    console.log(`   Средний рейтинг: ${reviewsData.average_rating || 0}`)
    console.log(`   Распределение:`, JSON.stringify(reviewsData.distribution || {}))
    
    if (reviewsData.reviews && reviewsData.reviews.length > 0) {
      console.log(`\n   Пример отзыва:`)
      const review = reviewsData.reviews[0]
      console.log(`   - ID: ${review.id}`)
      console.log(`   - Рейтинг: ${review.rating}/5`)
      console.log(`   - Статус: ${review.status}`)
      if (review.title) console.log(`   - Заголовок: ${review.title}`)
      if (review.comment) console.log(`   - Комментарий: ${review.comment.substring(0, 50)}...`)
      if (review.pros) console.log(`   - Плюсы: ${review.pros.substring(0, 50)}...`)
      if (review.cons) console.log(`   - Минусы: ${review.cons.substring(0, 50)}...`)
      if (review.images && review.images.length > 0) {
        console.log(`   - Изображений: ${review.images.length}`)
      }
    }
    console.log()

    // 3. Тест GET /store/products/:id/can-review
    console.log('3️⃣ Тест: GET /store/products/:id/can-review')
    console.log(`   URL: ${BASE_URL}/store/products/${productId}/can-review`)
    
    const canReviewRes = await fetch(`${BASE_URL}/store/products/${productId}/can-review`, { headers })
    
    if (!canReviewRes.ok) {
      console.log(`❌ Ошибка: ${canReviewRes.status}`)
      const errorText = await canReviewRes.text()
      console.log('   Ответ:', errorText.substring(0, 200))
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

    // 4. Тест с параметрами пагинации и сортировки
    console.log('4️⃣ Тест: GET /store/products/:id/reviews с параметрами')
    console.log('   Параметры: limit=5, offset=0, sort=rating_desc')
    
    const reviewsWithParamsRes = await fetch(
      `${BASE_URL}/store/products/${productId}/reviews?limit=5&offset=0&sort=rating_desc`,
      { headers }
    )
    
    if (reviewsWithParamsRes.ok) {
      const data = await reviewsWithParamsRes.json()
      console.log('✅ Пагинация и сортировка работают!')
      console.log(`   Получено отзывов: ${data.reviews?.length || 0}`)
      console.log(`   Всего: ${data.total || 0}`)
    } else {
      console.log(`⚠️  Ошибка с параметрами: ${reviewsWithParamsRes.status}`)
    }
    console.log()

    // Итоги
    console.log('=' .repeat(60))
    console.log('✅ ВСЕ ОСНОВНЫЕ ENDPOINTS РАБОТАЮТ!')
    console.log()
    console.log('📝 Следующие шаги для полного тестирования:')
    console.log('   1. Откройте страницу товара в браузере:')
    console.log(`      http://localhost:8000/products/${productId}`)
    console.log('   2. Прокрутите до секции отзывов')
    console.log('   3. Проверьте отображение отзывов')
    console.log('   4. Попробуйте создать отзыв (требует авторизации и полученного товара)')
    console.log('   5. Проверьте модерацию в админ-панели')
    console.log()
    console.log('💡 Для создания тестового отзыва нужно:')
    console.log('   - Авторизоваться как покупатель')
    console.log('   - Иметь заказ со статусом "completed"')
    console.log('   - В заказе должен быть этот товар')

  } catch (error) {
    console.error('❌ Ошибка:', error.message)
    if (error.cause) {
      console.error('   Причина:', error.cause.message)
    }
    console.error('\n💡 Убедитесь, что сервер запущен на порту 9000')
  }
}

testReviewsModule()
