# JSPulse Admin - Quick Reference

## 🚀 Быстрый старт

1. **Откройте админку:** `http://localhost:3000/admin`
2. **Войдите через Google** (кнопка "Войти" в хедере)
3. **Убедитесь, что ваш email** в `ADMIN_ALLOW_EMAILS`

## 📊 Основные функции

### Статистика системы
- **Вакансии:** общее количество, за 24ч, с описанием
- **Навыки:** уникальные навыки, общие упоминания

### Парсеры
| Парсер | Описание | Скрипт |
|--------|----------|--------|
| **Habr** | Парсит с Habr Career | `fetchAndSaveFromHabr.js` |
| **HeadHunter** | Парсит с hh.ru | `fetchAndSaveFromHH.js` |
| **Telegram Parse** | Парсит Telegram каналы | `parseTelegramUlbi.js` |
| **Telegram Enrich** | Обогащает Telegram данные | `enrichTelegramTelegraph.js` |
| **Careered** | Парсит через Careered API | `fetchAndSaveFromCareered.js` |

### Cron задачи
- **HeadHunter:** 9:00, 15:00, 21:00 (ежедневно)
- **Очистка БД:** 2:00 (воскресенье)
- **Health Check:** каждые 10 минут

## 🔧 API Endpoints

### Система
```bash
GET    /api/admin/stats              # Статистика
POST   /api/admin/clear-cache        # Очистка кэша
```

### Вакансии
```bash
DELETE /api/admin/vacancy/:id        # Удалить вакансию
```

### Парсеры
```bash
POST   /api/admin/parse/:source      # Запустить парсер
POST   /api/admin/parse-habr         # Habr
POST   /api/admin/parse-hh           # HeadHunter
POST   /api/admin/parse-telegram     # Telegram
POST   /api/admin/parse-careered     # Careered
```

### Cron
```bash
POST   /api/admin/cron/start         # Запустить cron
POST   /api/admin/cron/stop          # Остановить cron
GET    /api/admin/cron/status        # Статус cron
```

### Логи
```bash
GET    /api/admin/parsing-logs       # Получить логи
POST   /api/admin/parsing-logs/ingest # Добавить лог
```

## 🔐 Аутентификация

### Автоматическая аутентификация
Все запросы к админским API автоматически включают заголовок `Authorization: Bearer <firebase-id-token>` через `apiClient`.

### Переменные окружения

#### Backend
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_ALLOW_EMAILS=admin@example.com,another@example.com
```

#### Frontend
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
VITE_ADMIN_ALLOW_EMAILS=admin@example.com,another@example.com
```

### Компоненты аутентификации
- **`authStore.ts`** - Управление состоянием аутентификации
- **`firebase.client.ts`** - Firebase Auth клиент
- **`http.client.ts`** - API клиент с автоматической аутентификацией
- **`firebaseAuthMiddleware.ts`** - Backend middleware для валидации токенов

## 🚨 Устранение неполадок

### Ошибки аутентификации
- **401 Unauthorized:** Проверьте Firebase токен
- **403 Forbidden:** Проверьте email в `ADMIN_ALLOW_EMAILS`

### Ошибки парсеров
- **404 Parser not found:** Соберите backend (`pnpm run build`)
- **500 Failed to start:** Проверьте права доступа к скриптам

### Ошибки БД
- **MongoServerSelectionError:** Проверьте MongoDB
- **Connection closed:** Проверьте строку подключения

## 📝 Логи

### Типы логов
- **info** - информационные сообщения (синий)
- **success** - успешные операции (зеленый)
- **error** - ошибки (красный)

### Фильтрация
- По источнику: `?source=habr`
- Автоскролл к новым сообщениям
- Ручной скролл отключает автоскролл

## 🎯 Частые задачи

### Запуск парсера
1. Откройте админку
2. Найдите нужный парсер
3. Нажмите "Запустить"
4. Следите за логами

### Удаление вакансии
1. Найдите вакансию в списке
2. Нажмите кнопку "🗑️ Удалить"
3. Подтвердите действие

### Очистка кэша
1. В админке нажмите "Очистить кэш"
2. Подтвердите действие

### Управление cron
1. **Запуск:** "Запустить планировщик"
2. **Остановка:** "Остановить планировщик"
3. **Статус:** отображается в интерфейсе

## 🔍 Мониторинг

### Ключевые метрики
- Количество вакансий в реальном времени
- Статус парсеров (запущен/остановлен)
- Статус cron (работает/остановлен)

### Логи для проверки
- Backend логи в консоли сервера
- Parsing логи в админке
- Cron логи через планировщик

---

*Для подробной документации см. [admin-documentation.md](./admin-documentation.md)*
