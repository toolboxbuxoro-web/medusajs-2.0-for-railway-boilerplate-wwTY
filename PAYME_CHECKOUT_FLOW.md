# Правильный поток оплаты через Payme в Medusa 2.0

## Описание потока

Изучив репозиторий [payme-pkg](https://github.com/Muhammadali-Akbarov/payme-pkg) и текущую реализацию, вот правильный поток оплаты:

### Шаг 1: Checkout - Выбор метода оплаты
**URL**: `/[locale]/[countryCode]/checkout?step=payment`

1. Пользователь выбирает метод оплаты "Payme"
2. При выборе создается платежная сессия через `initiatePaymentSession()`
3. После создания сессии пользователь переходит на Review step

**Код**: `storefront/src/modules/checkout/components/payment/index.tsx`
- При выборе Payme вызывается `initiatePaymentSession()` с `provider_id: "pp_payme_payme"`
- После успешного создания сессии происходит переход на `step=review`

### Шаг 2: Review - Подтверждение и оплата
**URL**: `/[locale]/[countryCode]/checkout?step=review`

1. Пользователь видит детали заказа
2. Нажимает кнопку "Оплатить" (PaymePaymentButton)
3. Кнопка проверяет статус сессии:
   - Если `status === "authorized"` → сразу создает заказ
   - Если `status === "pending"` → генерирует URL и редиректит на Payme

**Код**: `storefront/src/modules/checkout/components/payment-button/payme-payment-button.tsx`
- `handlePayment()` проверяет статус сессии
- Если не авторизовано → `initiatePaymentSession()` → получение `payment_url` → редирект на Payme

### Шаг 3: Оплата на Payme
**URL**: `https://checkout.paycom.uz/{encoded_params}`

1. Пользователь вводит данные карты на Payme
2. Payme обрабатывает платеж
3. Payme вызывает Merchant API на `/payme`:
   - `CheckPerformTransaction` - проверка возможности оплаты
   - `CreateTransaction` - создание транзакции (state: 0 → 1)
   - `PerformTransaction` - выполнение транзакции (state: 1 → 2)
4. После успешной оплаты Payme редиректит на callback URL

**Backend**: `backend/src/api/payme/route.ts`
- Обрабатывает JSON-RPC запросы от Payme
- После `PerformTransaction` автоматически вызывает `authorizePaymentSession()` для обновления статуса

### Шаг 4: Возврат с Payme
**URL**: `/api/payme-callback?order_id={cart_id}&status=success`

1. Payme редиректит на `/api/payme-callback`
2. Callback проверяет статус оплаты
3. Редиректит на Review step с параметром `payment=success`

**Код**: `storefront/src/app/api/payme-callback/route.ts`
- Получает параметры от Payme (`order_id`, `status`, `transaction_id`)
- Редиректит на `/[locale]/[countryCode]/checkout?step=review&payment=success`

### Шаг 5: Завершение заказа
**URL**: `/[locale]/[countryCode]/checkout?step=review&payment=success`

1. PaymePaymentButton проверяет статус сессии при загрузке
2. Если `status === "authorized"` → автоматически вызывает `placeOrder()`
3. Если статус еще не обновлен → обновляет страницу и проверяет снова
4. После успешного создания заказа → редирект на страницу подтверждения

**Код**: `storefront/src/modules/checkout/components/payment-button/payme-payment-button.tsx`
- `useEffect` проверяет статус после возврата
- Если `session.status === "authorized"` → автоматически вызывает `placeOrder()`
- Если `payme_state === 2` но статус не обновлен → обновляет страницу

## Ключевые улучшения

### ✅ 1. Правильный редирект после оплаты
**Было**: Редирект на `step=payment`  
**Стало**: Редирект на `step=review&payment=success`

Это позволяет пользователю вернуться на Review step, где находится кнопка оплаты, и автоматически завершить заказ.

### ✅ 2. Автоматическая авторизация после PerformTransaction
**Добавлено**: Вызов `authorizePaymentSession()` после успешного `PerformTransaction`

```typescript
// backend/src/modules/payment-payme/services/payme-merchant.ts
await paymentModule.updatePaymentSession({...})

// Автоматически авторизуем сессию после успешной оплаты
try {
  await paymentModule.authorizePaymentSession(session.id, {
    data: newData
  })
} catch (authError) {
  // Log but don't fail
}
```

### ✅ 3. Автоматическое создание заказа после возврата
**Добавлено**: Проверка статуса в `useEffect` и автоматическое создание заказа

```typescript
// Если платеж уже авторизован, автоматически создаем заказ
if (session?.status === "authorized") {
  await placeOrder()
}
```

## Сравнение с payme-pkg

В репозитории [payme-pkg](https://github.com/Muhammadali-Akbarov/payme-pkg) используется Django интеграция:

1. **Django подход**:
   - Webhook endpoint обрабатывает callback от Payme
   - `handle_successfully_payment()` вызывается после успешной оплаты
   - Заказ обновляется/создается в callback handler

2. **Medusa 2.0 подход** (наш):
   - Merchant API обрабатывает JSON-RPC запросы от Payme
   - `PerformTransaction` обновляет статус сессии
   - Frontend проверяет статус после возврата и создает заказ

## Поток в виде диаграммы

```
1. Checkout (Payment Step)
   ↓
   Выбор Payme → Создание payment session
   ↓
2. Review Step
   ↓
   Кнопка "Оплатить" → Редирект на Payme
   ↓
3. Payme Checkout
   ↓
   Оплата → Payme вызывает Merchant API
   ↓
   PerformTransaction → authorizePaymentSession()
   ↓
4. Callback
   ↓
   /api/payme-callback → Редирект на Review Step
   ↓
5. Review Step (с payment=success)
   ↓
   Проверка статуса → Если authorized → placeOrder()
   ↓
6. Order Confirmation
```

## Важные моменты

1. **Статус сессии должен быть "authorized"** перед созданием заказа
2. **Callback должен редиректить на Review step**, а не на Payment step
3. **Автоматическая авторизация** после `PerformTransaction` критически важна
4. **Проверка статуса** при возврате с Payme необходима для надежности

## Тестирование

Для проверки правильности потока:

1. Выберите Payme на payment step
2. Перейдите на review step
3. Нажмите "Оплатить" → должен быть редирект на Payme
4. Завершите оплату на Payme
5. После возврата должны быть на review step
6. Заказ должен создаться автоматически (или кнопка должна быть активна)

## Возможные проблемы и решения

### Проблема: Статус не обновляется после возврата
**Решение**: Убедитесь, что `authorizePaymentSession()` вызывается после `PerformTransaction`

### Проблема: Пользователь попадает на payment step вместо review
**Решение**: Проверьте callback route - должен редиректить на `step=review`

### Проблема: Заказ не создается автоматически
**Решение**: Проверьте логику в `useEffect` PaymePaymentButton - должна проверять `status === "authorized"`







