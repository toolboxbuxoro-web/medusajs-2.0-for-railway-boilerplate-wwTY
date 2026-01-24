# Инструкция по тестированию модуля отзывов

## Шаг 1: Проверка и запуск миграций

### 1.1 Проверить, что миграция создана
```bash
cd backend
ls -la src/modules/reviews/migrations/
```

Должен быть файл `Migration20260123000000.ts`

### 1.2 Запустить миграцию
```bash
cd backend
npm run build
medusa migrations run
```

Если возникнут ошибки, проверьте:
- Что база данных PostgreSQL запущена
- Что `DATABASE_URL` в `.env` правильный
- Что таблица `review` не существует (или будет пересоздана)

### 1.3 Проверить, что таблица создана
```bash
# Подключитесь к PostgreSQL
psql $DATABASE_URL

# Проверьте структуру таблицы
\d review

# Проверьте индексы
\di review*
```

Должны быть:
- Таблица `review` со всеми полями
- Индексы: `IDX_review_deleted_at`, `IDX_review_product_id_status_created_at`, и т.д.
- Уникальный индекс: `IDX_review_product_id_customer_id_active_unique`

## Шаг 2: Проверка регистрации модуля

### 2.1 Проверить конфигурацию
```bash
cd backend
grep -A 3 '"reviews"' medusa-config.js
```

Должно быть:
```javascript
{
  key: "reviews",
  resolve: "./src/modules/reviews",
}
```

### 2.2 Пересобрать проект
```bash
cd backend
npm run build
```

### 2.3 Запустить сервер и проверить логи
```bash
cd backend
npm run dev
```

В логах не должно быть ошибок о модуле reviews. Если есть ошибки, проверьте:
- Что все импорты правильные
- Что модель экспортируется корректно
- Что сервис правильно наследуется от MedusaService

## Шаг 3: Тестирование API endpoints

### 3.1 Проверить Store API (требует авторизации)

#### GET /store/products/:id/reviews
```bash
# Замените PRODUCT_ID на реальный ID товара
curl -X GET "http://localhost:9000/store/products/PRODUCT_ID/reviews?limit=10&offset=0" \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

Ожидаемый ответ:
```json
{
  "reviews": [],
  "average_rating": 0,
  "distribution": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  "total": 0
}
```

#### GET /store/products/:id/can-review
```bash
curl -X GET "http://localhost:9000/store/products/PRODUCT_ID/can-review" \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

Ожидаемый ответ (если не авторизован):
```json
{
  "can_review": false,
  "reason": "auth_required"
}
```

#### POST /store/products/:id/reviews
```bash
# Сначала нужно получить order_id через can-review (если can_review: true)
curl -X POST "http://localhost:9000/store/products/PRODUCT_ID/reviews" \
  -H "Content-Type: application/json" \
  -H "x-publishable-api-key: YOUR_PUBLISHABLE_KEY" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "rating": 5,
    "title": "Отличный товар!",
    "comment": "Очень доволен покупкой",
    "pros": "Качество, цена",
    "cons": "Нет",
    "images": []
  }'
```

### 3.2 Проверить Admin API

#### GET /admin/reviews
```bash
# Требует авторизации администратора
curl -X GET "http://localhost:9000/admin/reviews?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### POST /admin/reviews/:id/approve
```bash
curl -X POST "http://localhost:9000/admin/reviews/REVIEW_ID/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Шаг 4: Тестирование через Postman/Insomnia

### 4.1 Создать коллекцию запросов

1. **Store API - Get Reviews**
   - Method: GET
   - URL: `{{baseUrl}}/store/products/{{productId}}/reviews`
   - Headers:
     - `x-publishable-api-key: {{publishableKey}}`
     - `Cookie: {{sessionCookie}}`

2. **Store API - Check Can Review**
   - Method: GET
   - URL: `{{baseUrl}}/store/products/{{productId}}/can-review`
   - Headers: (те же)

3. **Store API - Create Review**
   - Method: POST
   - URL: `{{baseUrl}}/store/products/{{productId}}/reviews`
   - Body (JSON):
   ```json
   {
     "rating": 5,
     "title": "Тестовый отзыв",
     "comment": "Это тестовый отзыв для проверки функциональности",
     "pros": "Качество",
     "cons": null,
     "images": []
   }
   ```

4. **Admin API - List Reviews**
   - Method: GET
   - URL: `{{baseUrl}}/admin/reviews?status=pending`
   - Headers:
     - `Authorization: Bearer {{adminToken}}`

5. **Admin API - Approve Review**
   - Method: POST
   - URL: `{{baseUrl}}/admin/reviews/{{reviewId}}/approve`
   - Headers: (те же)

## Шаг 5: Проверка работы Subscriber

### 5.1 Создать тестовый отзыв
Создайте отзыв через API (см. выше)

### 5.2 Проверить логи
В логах сервера должны появиться сообщения:
```
[ReviewAggregation] Event ... - Processing review.created for review ...
[ReviewAggregation] Event ... - Successfully updated product ...: avg=5.0, count=1
```

### 5.3 Проверить product.metadata
```bash
# Через SQL
psql $DATABASE_URL
SELECT id, metadata->>'rating_avg', metadata->>'rating_count', metadata->>'rating_distribution' 
FROM product 
WHERE id = 'YOUR_PRODUCT_ID';
```

Должны быть:
- `rating_avg`: средний рейтинг
- `rating_count`: количество одобренных отзывов
- `rating_distribution`: распределение по рейтингам

## Шаг 6: Тестирование Frontend

### 6.1 Запустить storefront
```bash
cd storefront
npm run dev
```

### 6.2 Проверить страницу товара
1. Откройте страницу товара: `http://localhost:8000/products/[product-id]`
2. Прокрутите до секции отзывов
3. Проверьте:
   - Отображение существующих отзывов
   - Форму добавления отзыва
   - Поля: title, pros, cons, comment, images
   - Валидацию полей

### 6.3 Протестировать создание отзыва
1. Войдите как покупатель, который получил товар
2. Заполните форму отзыва:
   - Выберите рейтинг (звезды)
   - Заполните title (опционально)
   - Заполните pros (опционально)
   - Заполните cons (опционально)
   - Заполните comment (опционально)
   - Загрузите изображения (макс 5)
3. Отправьте отзыв
4. Проверьте, что отзыв появился со статусом "pending"

### 6.4 Проверить отображение отзывов
- Отображаются только approved отзывы
- Показываются pros/cons с иконками
- Показываются изображения (кликабельные)
- Показывается title (если есть)
- Показывается admin_response (если есть)

## Шаг 7: Тестирование Admin панели

### 7.1 Войти в админ-панель
```bash
# Откройте админ-панель
http://localhost:9000/app
```

### 7.2 Проверить список отзывов
1. Перейдите в раздел Reviews (если есть виджет) или используйте API
2. Проверьте фильтрацию по статусу
3. Проверьте пагинацию

### 7.3 Протестировать модерацию
1. Найдите отзыв со статусом "pending"
2. Одобрите отзыв через API или админ-панель
3. Проверьте, что:
   - Статус изменился на "approved"
   - Рейтинг пересчитался в product.metadata
   - Отзыв появился на странице товара

## Шаг 8: Проверка edge cases

### 8.1 Попытка создать второй отзыв
- Создайте отзыв для товара
- Попробуйте создать второй отзыв для того же товара
- Должна быть ошибка: "You have already reviewed this product"

### 8.2 Отзыв без получения товара
- Попробуйте создать отзыв для товара, который не был получен
- Должна быть ошибка: "You can only review products you have received"

### 8.3 Валидация полей
- Попробуйте отправить rating > 5 или < 1
- Попробуйте отправить comment > 2000 символов
- Попробуйте отправить pros > 500 символов
- Попробуйте загрузить > 5 изображений
- Все должны возвращать ошибки валидации

## Шаг 9: Проверка производительности

### 9.1 Проверить индексы
```sql
-- Проверить использование индексов
EXPLAIN ANALYZE 
SELECT * FROM review 
WHERE product_id = 'PRODUCT_ID' 
  AND status = 'approved' 
  AND deleted_at IS NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

Должен использоваться индекс `IDX_review_product_id_status_created_at`

### 9.2 Проверить уникальный индекс
```sql
-- Попробовать создать дубликат активного отзыва
-- Должна быть ошибка уникальности
```

## Возможные проблемы и решения

### Проблема: Миграция не запускается
**Решение:**
- Проверьте, что база данных доступна
- Проверьте права доступа к БД
- Убедитесь, что таблица `review` не существует (или удалите её вручную)

### Проблема: Модуль не регистрируется
**Решение:**
- Проверьте синтаксис в `medusa-config.js`
- Убедитесь, что путь к модулю правильный
- Пересоберите проект: `npm run build`

### Проблема: API возвращает 404
**Решение:**
- Проверьте, что роуты созданы в правильных папках
- Убедитесь, что сервер перезапущен после изменений
- Проверьте логи сервера на ошибки

### Проблема: Subscriber не работает
**Решение:**
- Проверьте, что Event Bus настроен (Redis)
- Проверьте логи на ошибки в subscriber
- Убедитесь, что события эмитятся из сервиса

### Проблема: Frontend не работает
**Решение:**
- Проверьте консоль браузера на ошибки
- Убедитесь, что API endpoints доступны
- Проверьте CORS настройки

## Чеклист перед деплоем

- [ ] Миграция успешно выполнена
- [ ] Модуль регистрируется без ошибок
- [ ] Store API работает (GET/POST reviews)
- [ ] Admin API работает (approve/reject)
- [ ] Subscriber пересчитывает рейтинги
- [ ] Frontend отображает отзывы
- [ ] Форма создания отзыва работает
- [ ] Валидация работает корректно
- [ ] Проверка получения товара работает
- [ ] Модерация работает
- [ ] Индексы созданы и используются
- [ ] Нет ошибок в логах

## Следующие шаги

1. **Создать тестовые данные:**
   - Создать тестовый заказ со статусом "completed"
   - Создать тестовый отзыв
   - Протестировать весь flow

2. **Добавить логирование:**
   - Улучшить логирование в критических местах
   - Добавить метрики

3. **Оптимизация:**
   - Проверить производительность запросов
   - Оптимизировать индексы при необходимости

4. **Документация:**
   - Обновить API документацию
   - Добавить примеры использования
