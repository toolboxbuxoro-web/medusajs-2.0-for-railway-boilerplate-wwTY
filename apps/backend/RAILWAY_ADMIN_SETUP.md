# Создание администратора на Railway

## Способ 1: Через Railway CLI (Рекомендуется)

1. Установите Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Войдите в Railway:
   ```bash
   railway login
   ```

3. Подключитесь к вашему проекту:
   ```bash
   railway link
   ```

4. Запустите скрипт создания администратора:
   ```bash
   railway run --service backend pnpm run create:admin
   ```

   Или с явным указанием переменных окружения:
   ```bash
   railway run --service backend DATABASE_URL="your_database_url" MEDUSA_ADMIN_EMAIL="admin@toolbox.com" MEDUSA_ADMIN_PASSWORD="2cj0uudyu3lb9g714vwvepdd4mepym2x" pnpm run create:admin
   ```

## Способ 2: Через Railway Dashboard

1. Откройте ваш проект на Railway
2. Перейдите в раздел "Variables"
3. Добавьте переменные окружения:
   - `MEDUSA_ADMIN_EMAIL=admin@toolbox.com`
   - `MEDUSA_ADMIN_PASSWORD=2cj0uudyu3lb9g714vwvepdd4mepym2x`
4. Перейдите в раздел "Deployments"
5. Откройте последний деплой
6. В разделе "Deploy Logs" найдите кнопку "Run Command" или используйте "Shell"
7. Выполните команду:
   ```bash
   pnpm run create:admin
   ```

## Способ 3: Через Railway Console (One-off Command)

1. В Railway Dashboard откройте ваш сервис backend
2. Перейдите в раздел "Settings" → "Deploy"
3. Найдите раздел "One-off Commands" или используйте "Shell"
4. Выполните:
   ```bash
   cd backend
   pnpm run create:admin
   ```

## Способ 4: Автоматическое создание при деплое

Добавьте в `package.json` скрипт, который будет запускаться после деплоя:

```json
"scripts": {
  "postdeploy": "pnpm run create:admin"
}
```

## Проверка

После создания администратора вы сможете войти в админ-панель:
- URL: `https://your-railway-app.railway.app/app`
- Email: `admin@toolbox.com`
- Password: `2cj0uudyu3lb9g714vwvepdd4mepym2x`

## Важно

- Убедитесь, что переменная `DATABASE_URL` правильно настроена на Railway
- Скрипт автоматически удалит существующего пользователя с таким email перед созданием нового
- Если администратор не создается, проверьте логи Railway на наличие ошибок

## Альтернативный способ: Использование Medusa CLI

Если скрипт не работает, попробуйте использовать встроенную команду Medusa CLI:

```bash
# Через Railway CLI
railway run --service backend MEDUSA_ADMIN_EMAIL="admin@toolbox.com" MEDUSA_ADMIN_PASSWORD="2cj0uudyu3lb9g714vwvepdd4mepym2x" pnpm run create:admin:cli

# Или напрямую
railway run --service backend medusa user -e admin@toolbox.com -p 2cj0uudyu3lb9g714vwvepdd4mepym2x
```

## Решение проблем

### Проблема: Не могу войти с созданными данными

**Возможные причины:**
1. Пользователь создан в другой базе данных (локальной вместо Railway)
2. Пароль не был правильно хеширован
3. Пользователь не активирован
4. Неправильный URL админ-панели

**Решения:**
1. Убедитесь, что скрипт запускается на Railway, а не локально
2. Проверьте, что `DATABASE_URL` указывает на правильную базу данных Railway
3. Попробуйте использовать Medusa CLI команду вместо скрипта
4. Проверьте логи Railway на наличие ошибок при создании пользователя
5. Убедитесь, что используете правильный URL админ-панели (обычно `https://your-app.railway.app/app`)

