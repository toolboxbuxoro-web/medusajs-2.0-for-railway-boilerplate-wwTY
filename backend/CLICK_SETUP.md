# Click Payment Integration Setup

## Необходимые переменные окружения

### Backend (.env)

```bash
# Click (обязательные)
CLICK_MERCHANT_ID=your_merchant_id      # ID мерчанта из личного кабинета Click
CLICK_SERVICE_ID=your_service_id        # ID сервиса из личного кабинета Click  
CLICK_SECRET_KEY=your_secret_key        # Секретный ключ для подписи
CLICK_USER_ID=your_user_id              # User ID для Auth header (требуется для фискализации)

# Click (опциональные)
CLICK_PAY_URL=https://my.click.uz/services/pay  # URL для оплаты (default)
CLICK_MERCHANT_USER_ID=                          # Для pay-by-card виджета
CLICK_CARD_TYPE=uzcard                           # uzcard или humo
```

### Storefront (.env.local)

```bash
# URL бэкенда (для API вызовов)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend.railway.app

# URL магазина (для редиректов)
STORE_URL=https://your-store.vercel.app
```

---

## Callback URL для настройки в Click

В личном кабинете Click укажите следующие endpoint'ы:

| Параметр | URL |
|----------|-----|
| **Prepare URL** | `https://your-backend.railway.app/click/prepare` |
| **Complete URL** | `https://your-backend.railway.app/click/complete` |
| **Return URL** | Генерируется автоматически: `https://your-store.vercel.app/api/click-callback` |

---

## Архитектура Click API

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              PAYMENT FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

1. Пользователь нажимает "Оплатить через Click"
   ↓
2. Frontend redirect → my.click.uz/services/pay?... 
   ↓
3. Пользователь вводит данные карты в Click
   ↓
4. Click → POST /click/prepare (Backend)
   ← Backend возвращает merchant_prepare_id
   ↓
5. Пользователь подтверждает оплату
   ↓
6. Click → POST /click/complete (Backend)
   ← Backend создаёт заказ, возвращает success
   ↓
7. Click redirect → /api/click-callback (Storefront)
   ↓
8. Storefront показывает результат и редиректит на страницу заказов
```

---

## Проверка настройки

### 1. Backend логи
При старте должно появиться:
```
✅ Click providers added to config
```

Если видите:
```
❌ Click providers NOT added: Missing CLICK_MERCHANT_ID/CLICK_SERVICE_ID/CLICK_SECRET_KEY
```
— значит не все ENV переменные заданы.

### 2. Проверка в Admin Panel
1. Откройте Medusa Admin → Settings → Regions
2. Выберите регион (например, UZ)
3. В Payment Providers должны появиться:
   - `click` (редирект на my.click.uz)
   - `click_pay_by_card` (виджет на странице checkout)
4. Активируйте нужные провайдеры

### 3. Тест на Storefront
1. Добавьте товар в корзину
2. Перейдите к оплате
3. Выберите Click
4. Нажмите "Оформить заказ"
5. Должен произойти редирект на my.click.uz

---

## Troubleshooting

### Ошибка подписи (SIGN CHECK FAILED)
- Проверьте что `CLICK_SECRET_KEY` точно совпадает с ключом в кабинете Click
- Убедитесь что нет лишних пробелов в ENV переменных

### Не отображается Click в checkout
- Проверьте что провайдер активирован в Admin → Regions
- Перезапустите backend после изменения ENV

### Callback не приходит
- Убедитесь что Prepare/Complete URL правильно настроены в кабинете Click
- Проверьте что backend доступен извне (не localhost)

---

## Фискализация

Фискализация чеков обязательна при использовании более 1 ИКПУ.

### Как работает:
1. После успешного `Complete` автоматически вызывается `submitFiscalizationData()`
2. Данные отправляются в `api.click.uz/v2/merchant/payment/ofd_data/submit_items`
3. Товары берутся из корзины с MXIK кодами из `product.metadata.mxik_code`

### Требования:
- `CLICK_USER_ID` должен быть установлен в ENV
- Все товары должны иметь MXIK коды (устанавливаются в Admin → Products → Metadata)

### Логи при успешной фискализации:
```
[ClickMerchant] Prepared 3 items for fiscalization, sum=150000 tiyin
[ClickMerchant] Submitting fiscalization for payment_id=123456
[ClickMerchant] Fiscalization submitted successfully for payment_id=123456
```
