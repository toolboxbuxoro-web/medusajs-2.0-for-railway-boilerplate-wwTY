# Анализ работы оплаты через Payme

## Общая архитектура

Интеграция Payme состоит из нескольких компонентов:

### 1. **Backend компоненты**

#### a) Payment Provider Service (`backend/src/modules/payment-payme/services/payme.ts`)
- **Назначение**: Реализует интерфейс `AbstractPaymentProvider` для Medusa
- **Основные методы**:
  - `initiatePayment()` - создает платежную сессию и генерирует URL для Payme
  - `authorizePayment()` - проверяет статус авторизации платежа
  - `getPaymentStatus()` - возвращает текущий статус платежа
  - `generatePaymentUrl()` - формирует URL для редиректа на Payme

#### b) Merchant API Service (`backend/src/modules/payment-payme/services/payme-merchant.ts`)
- **Назначение**: Обрабатывает JSON-RPC запросы от Payme (Merchant API)
- **Основные методы**:
  - `CheckPerformTransaction` - валидация перед созданием транзакции
  - `CreateTransaction` - создание транзакции в Payme
  - `PerformTransaction` - финализация платежа (state: 1 → 2)
  - `CancelTransaction` - отмена транзакции
  - `CheckTransaction` - проверка статуса транзакции

#### c) API Route (`backend/src/api/payme/route.ts`)
- **Назначение**: Endpoint для приема JSON-RPC запросов от Payme
- **Аутентификация**: Basic Auth с `PAYME_KEY` из env
- **URL**: `/payme` (POST)

### 2. **Frontend компоненты**

#### a) Payment Button (`storefront/src/modules/checkout/components/payment-button/payme-payment-button.tsx`)
- Инициирует платежную сессию
- Редиректит пользователя на Payme
- Обрабатывает уже авторизованные платежи

#### b) Callback Route (`storefront/src/app/api/payme-callback/route.ts`)
- Обрабатывает редирект после оплаты
- Перенаправляет на checkout с правильной локалью

#### c) Backend Callback (`backend/src/api/store/payme/callback/route.ts`)
- Обрабатывает callback от Payme
- Перенаправляет на страницу успеха/ошибки

## Поток оплаты

### Шаг 1: Инициализация платежа
1. Пользователь нажимает кнопку оплаты
2. Frontend вызывает `initiatePaymentSession()` с `provider_id: "pp_payme_payme"`
3. Backend создает платежную сессию через `PaymePaymentProviderService.initiatePayment()`
4. Генерируется URL для Payme в формате:
   ```
   https://checkout.paycom.uz/{base64_params}
   ```
   Где `params = m={merchant_id};ac.order_id={cart_id};a={amount};c={return_url}`

### Шаг 2: Редирект на Payme
1. Пользователь перенаправляется на Payme
2. Payme обрабатывает платеж

### Шаг 3: Payme вызывает Merchant API
Payme отправляет JSON-RPC запросы на `/payme`:

1. **CheckPerformTransaction**
   - Проверяет наличие корзины
   - Валидирует сумму (использует `cart.total` как источник истины)
   - Проверяет, не оплачен ли заказ уже

2. **CreateTransaction**
   - Создает транзакцию в Payme
   - Сохраняет `payme_transaction_id` и `payme_state: 1` в сессию
   - Возвращает Medusa Session ID как `transaction` ID

3. **PerformTransaction**
   - Финализирует платеж (state: 1 → 2)
   - Устанавливает `payme_state: 2` и `payme_perform_time`
   - Платеж считается авторизованным

### Шаг 4: Возврат пользователя
1. Payme редиректит на `/api/payme-callback` (storefront)
2. Storefront callback перенаправляет на `/[locale]/[countryCode]/checkout?step=payment`
3. Backend callback (`/store/payme/callback`) также может обработать callback

### Шаг 5: Завершение заказа
1. Frontend проверяет статус сессии (`session.status === "authorized"`)
2. Если авторизовано, вызывается `placeOrder()`
3. Заказ создается в Medusa

## Важные детали реализации

### Обработка сумм
- Medusa хранит суммы в минорных единицах (tiyin для UZS)
- Payme ожидает суммы в tiyin
- Валидация использует `cart.total` как источник истины (не `session.data.amount`)

### Состояния транзакций (payme_state)
- `0` - не создана
- `1` - создана (CreateTransaction)
- `2` - выполнена (PerformTransaction)
- `-1` - отменена до выполнения
- `-2` - отменена после выполнения (возврат)

### Поиск сессий
- Сначала по Medusa Session ID
- Fallback: по `payme_transaction_id` в данных сессии

### Idempotency
- Все методы Merchant API идемпотентны
- Повторные вызовы с теми же параметрами возвращают текущее состояние

## Потенциальные проблемы

### 1. **Двойной callback**
Есть два callback endpoint:
- `storefront/src/app/api/payme-callback/route.ts` - простой редирект
- `backend/src/api/store/payme/callback/route.ts` - более сложная логика

**Проблема**: Неясно, какой используется. В `payme.ts` указан `returnUrl = ${cleanStoreUrl}/api/payme-callback`, что указывает на storefront callback.

**Рекомендация**: Убедиться, что используется правильный callback и он обновляет статус платежной сессии.

### 2. **Обновление статуса после возврата**
После возврата с Payme статус сессии может не обновиться автоматически. Нужно:
- Проверить статус через `authorizePayment()` или `getPaymentStatus()`
- Обновить сессию, если `payme_state === 2`

### 3. **Проверка авторизации**
В `PaymePaymentButton` проверяется `session?.status === "authorized"`, но статус может не обновиться автоматически после возврата с Payme.

**Рекомендация**: После возврата с Payme вызывать `authorizePayment()` для обновления статуса.

### 4. **Конфигурация**
Проверьте наличие переменных окружения:
- `PAYME_ID` - ID мерчанта
- `PAYME_KEY` - ключ для Basic Auth
- `PAYME_URL` - URL Payme (опционально, по умолчанию `https://checkout.paycom.uz`)
- `STORE_URL` - URL storefront для return URL

### 5. **Валидация сумм**
Валидация использует `cart.total`, что правильно, но нужно убедиться, что:
- Сумма в сессии соответствует сумме в корзине
- При изменении корзины сессия обновляется или пересоздается

## Внесенные улучшения

### ✅ Автоматическая авторизация после PerformTransaction
**Критическое улучшение**: Добавлен вызов `authorizePaymentSession` после успешного `PerformTransaction`:
- После того как Payme выполняет транзакцию (state: 1 → 2), автоматически вызывается авторизация сессии
- Это обновляет статус сессии на "authorized", что позволяет создать заказ
- Без этого улучшения статус сессии оставался "pending", даже после успешной оплаты

**Код в `payme-merchant.ts`**:
```typescript
// После updatePaymentSession с payme_state: 2
try {
  await paymentModule.authorizePaymentSession(session.id, {
    data: newData
  })
  this.logger_.info(`[PerformTransaction] Authorized payment session=${session.id}`)
} catch (authError) {
  // Log error but don't fail the transaction
  this.logger_.warn(`[PerformTransaction] Failed to authorize session, but payment was performed`)
}
```

### ✅ Автоматическая проверка статуса после возврата
Добавлена автоматическая проверка статуса платежа в `PaymePaymentButton`:
- При возврате с Payme компонент проверяет `payme_state` в данных сессии
- Если `payme_state === 2` (платеж выполнен), но статус сессии не "authorized", происходит обновление страницы
- Обработка query параметров `payment=success` и `payment=failed` из callback

### Код улучшений:
```typescript
// В PaymePaymentButton добавлен useEffect для проверки статуса
useEffect(() => {
  const checkPaymentStatus = async () => {
    const paymentSuccess = searchParams.get("payment") === "success"
    const paymentFailed = searchParams.get("payment") === "failed"
    
    if (!session || checkingStatus) return

    const sessionData = session.data as any
    
    // Если платеж выполнен, но статус не обновлен - обновляем страницу
    if (sessionData?.payme_state === 2 && session.status !== "authorized") {
      setCheckingStatus(true)
      setTimeout(() => {
        router.refresh()
      }, 500)
    }
    // ... обработка других случаев
  }
  checkPaymentStatus()
}, [session, searchParams, router, checkingStatus])
```

## Рекомендации по дальнейшему улучшению

1. **Улучшить обработку ошибок**
   - Более детальное логирование
   - Обработка edge cases (таймауты, дубликаты транзакций)

2. **Добавить webhook обработку**
   - Сейчас webhook endpoint только логирует данные
   - Нужно добавить обновление статуса заказа при получении webhook от Payme

3. **Тестирование**
   - Использовать `test-payme-api-route.ts` для проверки логики
   - Добавить интеграционные тесты

4. **Мониторинг**
   - Логировать все важные события
   - Отслеживать неудачные транзакции

5. **Улучшить callback обработку**
   - Убедиться, что backend callback (`/store/payme/callback`) обновляет статус сессии
   - Или использовать только storefront callback с правильной логикой

## Правильный поток оплаты

См. подробное описание в [PAYME_CHECKOUT_FLOW.md](./PAYME_CHECKOUT_FLOW.md)

### Краткое описание потока:

1. **Checkout → Payment Step**: Выбор Payme → создание session → переход на Review
2. **Review Step**: Кнопка "Оплатить" → редирект на Payme
3. **Payme**: Оплата → Merchant API → PerformTransaction → authorizePaymentSession()
4. **Callback**: Редирект на Review Step с `payment=success`
5. **Review Step**: Проверка статуса → если authorized → автоматически placeOrder()
6. **Order Confirmation**: Редирект на страницу подтверждения заказа

### Ключевые изменения:

- ✅ Callback теперь редиректит на `step=review` вместо `step=payment`
- ✅ Автоматическая авторизация после PerformTransaction
- ✅ Автоматическое создание заказа при возврате с успешной оплатой

## Проверка работоспособности

Для проверки работы Payme:

1. **Проверьте конфигурацию**:
   ```bash
   # В backend/.env должны быть:
   PAYME_ID=your_merchant_id
   PAYME_KEY=your_merchant_key
   STORE_URL=https://your-store.com
   ```

2. **Проверьте логи**:
   - При инициализации: `[Payme] Provider initialized`
   - При запросах от Payme: `Payme Request: {method}`
   - При ошибках: `Payme Error`
   - После PerformTransaction: `[PerformTransaction] Authorized payment session`

3. **Проверьте статус сессии**:
   - После возврата с Payme проверьте `session.data.payme_state`
   - Должно быть `2` для успешного платежа
   - Статус сессии должен быть `"authorized"`

4. **Тестирование**:
   ```bash
   # Запустите тестовый скрипт
   medusa exec test-payme-api-route.ts
   ```

5. **Проверьте поток**:
   - Выберите Payme → перейдите на Review
   - Нажмите "Оплатить" → должен быть редирект на Payme
   - После оплаты → должны вернуться на Review step
   - Заказ должен создаться автоматически

