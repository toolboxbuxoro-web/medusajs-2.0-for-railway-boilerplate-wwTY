#!/bin/bash

# Скрипт для создания администратора на Railway
# Использование: railway run --service backend bash railway-create-admin.sh

echo "🚀 Создание администратора на Railway..."

# Установка переменных окружения (если не установлены)
export MEDUSA_ADMIN_EMAIL=${MEDUSA_ADMIN_EMAIL:-"admin@toolbox.com"}
export MEDUSA_ADMIN_PASSWORD=${MEDUSA_ADMIN_PASSWORD:-"2cj0uudyu3lb9g714vwvepdd4mepym2x"}

echo "📧 Email: $MEDUSA_ADMIN_EMAIL"
echo "🔑 Password: $MEDUSA_ADMIN_PASSWORD"
echo ""

# Запуск скрипта создания администратора
pnpm run create:admin

echo ""
echo "✅ Готово! Теперь вы можете войти в админ-панель с указанными данными."

