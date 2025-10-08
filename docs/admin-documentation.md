# JSPulse Admin Panel Documentation

## Обзор

Административная панель JSPulse предоставляет полный контроль над системой парсинга вакансий, управлением данными и мониторингом состояния системы. Панель доступна только авторизованным администраторам через Firebase Authentication.

## Доступ к админке

### URL
- **Локальная разработка:** `http://localhost:3000/admin`
- **Продакшн:** `https://yourdomain.com/admin`

### Аутентификация
Админка использует Firebase Authentication с Google OAuth. Для доступа необходимо:

1. **Настроить Firebase проект** с Google провайдером
2. **Добавить email в allowlist** в переменной `ADMIN_ALLOW_EMAILS`
3. **Войти через Google** используя кнопку "Войти" в хедере

### Переменные окружения

#### Backend (.env)
```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_ALLOW_EMAILS=admin@example.com,another@example.com
```

#### Frontend (.env)
```bash
# Firebase Client SDK
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Функциональность

### 1. Системная статистика

Отображает ключевые метрики системы:

- **📝 Вакансии**
  - Общее количество вакансий в базе
  - Количество добавленных за последние 24 часа
  - Количество вакансий с полным описанием

- **🛠️ Навыки**
  - Количество уникальных навыков
  - Общее количество упоминаний навыков

### 2. Управление парсерами

#### Доступные парсеры

1. **Habr** (`habr`)
   - Парсит вакансии с Habr Career
   - Скрипт: `fetchAndSaveFromHabr.js`

2. **HeadHunter** (`hh`)
   - Парсит вакансии с hh.ru
   - Скрипт: `fetchAndSaveFromHH.js`

3. **Telegram Parse** (`telegram-parse`)
   - Парсит вакансии из Telegram каналов
   - Скрипт: `parseTelegramUlbi.js`

4. **Telegram Enrich** (`telegram-enrich`)
   - Обогащает данные из Telegram
   - Скрипт: `enrichTelegramTelegraph.js`

5. **Careered API** (`careered-api`)
   - Парсит вакансии через Careered API
   - Скрипт: `fetchAndSaveFromCareered.js`

#### Запуск парсеров

1. **Через UI:** Нажмите кнопку "Запустить" рядом с нужным парсером
2. **Через API:** `POST /api/admin/parse/{source}`
3. **Прямые endpoints:**
   - `POST /api/admin/parse-habr`
   - `POST /api/admin/parse-hh`
   - `POST /api/admin/parse-telegram`
   - `POST /api/admin/parse-careered`

### 3. Управление Cron задачами

#### Планировщик задач
- **Запуск:** `POST /api/admin/cron/start`
- **Остановка:** `POST /api/admin/cron/stop`
- **Статус:** `GET /api/admin/cron/status`

#### Расписание задач
- **HeadHunter парсер:** 9:00, 15:00, 21:00 (ежедневно)
- **Очистка базы:** 2:00 (воскресенье)
- **Проверка здоровья:** каждые 10 минут

### 4. Логи парсинга

#### Просмотр логов
- **В реальном времени** в админке
- **Фильтрация по источнику** (habr, hh, telegram, etc.)
- **Автоскролл** к новым сообщениям
- **Цветовая индикация** (info, success, error)

#### API для логов
- **Получить логи:** `GET /api/admin/parsing-logs?source={source}`
- **Добавить лог:** `POST /api/admin/parsing-logs/ingest`

### 5. Управление вакансиями

#### Удаление вакансий
- **Кнопка удаления** появляется только для админов
- **Подтверждение** перед удалением
- **API:** `DELETE /api/admin/vacancy/{id}`

#### Очистка кэша
- **Кнопка "Очистить кэш"** в админке
- **API:** `POST /api/admin/clear-cache`

## API Endpoints

### Аутентификация
Все endpoints требуют Firebase ID Token в заголовке:
```
Authorization: Bearer <firebase-id-token>
```

### Система

#### GET /api/admin/stats
Получить статистику системы.

**Response:**
```json
{
  "success": true,
  "data": {
    "vacancies": {
      "total": 1234,
      "recent24h": 56,
      "withFullDescription": 890
    },
    "skills": {
      "unique": 234,
      "total": 5678
    }
  }
}
```

#### POST /api/admin/clear-cache
Очистить кэш системы.

**Response:**
```json
{
  "success": true,
  "data": {
    "cleared": true
  }
}
```

### Вакансии

#### DELETE /api/admin/vacancy/:id
Удалить вакансию по ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "vacancy-id"
  }
}
```

### Парсеры

#### POST /api/admin/parse/:source
Запустить парсер для указанного источника.

**Parameters:**
- `source` - источник парсинга (habr, hh, telegram-parse, telegram-enrich, careered-api)

**Response:**
```json
{
  "success": true,
  "data": {
    "started": true,
    "pid": 12345,
    "script": "/path/to/script.js"
  }
}
```

### Cron

#### POST /api/admin/cron/start
Запустить планировщик задач.

**Response:**
```json
{
  "success": true,
  "data": {
    "running": true,
    "pid": 12345,
    "startedAt": 1640995200000
  }
}
```

#### POST /api/admin/cron/stop
Остановить планировщик задач.

**Response:**
```json
{
  "success": true,
  "data": {
    "running": false,
    "stopped": true
  }
}
```

#### GET /api/admin/cron/status
Получить статус планировщика.

**Response:**
```json
{
  "success": true,
  "data": {
    "running": true,
    "pid": 12345,
    "startedAt": 1640995200000
  }
}
```

### Логи

#### GET /api/admin/parsing-logs
Получить логи парсинга.

**Query Parameters:**
- `source` (optional) - фильтр по источнику

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-id",
      "source": "habr",
      "message": "Starting Habr parser...",
      "type": "info",
      "timestamp": "2023-01-01T12:00:00.000Z"
    }
  ]
}
```

#### POST /api/admin/parsing-logs/ingest
Добавить лог (для внешних систем).

**Body:**
```json
{
  "source": "cron",
  "message": "Cron job completed",
  "type": "success"
}
```

## Безопасность

### Аутентификация
- **Firebase ID Token** проверяется на каждом запросе
- **Токен автоматически обновляется** при истечении
- **Автоматический выход** при недействительном токене

### Авторизация
- **Email allowlist** в переменной `ADMIN_ALLOW_EMAILS`
- **Проверка на сервере** для каждого запроса
- **403 Forbidden** для неавторизованных пользователей

### Защита от атак
- **CORS** настроен для разрешенных доменов
- **Rate limiting** (если настроен)
- **Валидация входных данных** через Zod схемы

## Устранение неполадок

### Проблемы с аутентификацией

#### "Missing Authorization header"
- Проверьте, что Firebase токен отправляется в заголовке
- Убедитесь, что пользователь авторизован

#### "Invalid Authorization header"
- Проверьте формат заголовка: `Bearer <token>`
- Убедитесь, что токен не пустой

#### "Unauthorized"
- Проверьте, что Firebase токен действителен
- Убедитесь, что токен не истек

#### "Forbidden"
- Проверьте, что email пользователя в `ADMIN_ALLOW_EMAILS`
- Убедитесь, что переменная окружения настроена

### Проблемы с парсерами

#### "Parser script not found"
- Убедитесь, что backend собран (`pnpm run build`)
- Проверьте, что скрипты существуют в `backend/dist/scripts/`

#### "Failed to start parser"
- Проверьте права доступа к скриптам
- Убедитесь, что все зависимости установлены

### Проблемы с базой данных

#### "MongoServerSelectionError"
- Проверьте, что MongoDB запущен
- Убедитесь, что строка подключения правильная
- Проверьте сетевое соединение

## Мониторинг

### Логи системы
- **Backend логи** в консоли сервера
- **Parsing логи** в админке
- **Cron логи** через планировщик

### Метрики
- **Количество вакансий** в реальном времени
- **Статус парсеров** (запущен/остановлен)
- **Статус cron** (работает/остановлен)

### Алерты
- **Ошибки парсинга** отображаются в логах
- **Недоступность базы** логируется
- **Неудачные cron задачи** записываются

## Разработка

### Добавление нового парсера

1. **Создайте скрипт** в `backend/src/scripts/`
2. **Добавьте в `ParsingSource`** enum
3. **Обновите `resolveParserCommand`** в `adminRoutes.ts`
4. **Добавьте кнопку** в `ParsingActions.svelte`

### Добавление новой метрики

1. **Обновите `SystemStats`** тип
2. **Добавьте в `GetSystemStatsUseCase`**
3. **Обновите `SystemStats.svelte`** компонент

### Добавление нового API endpoint

1. **Создайте route** в `adminRoutes.ts`
2. **Добавьте middleware** для аутентификации
3. **Обновите frontend** для использования API

## Контакты

При возникновении проблем или вопросов:
- **Issues:** Создайте issue в репозитории
- **Email:** admin@jspulse.com
- **Документация:** Обновляется при каждом изменении

---

*Последнее обновление: 2025-01-08*
