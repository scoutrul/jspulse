# Структура проекта JSPulse

## 🏗️ Общая архитектура

```
jspulse/
├── backend/          # Node.js + Express API
├── frontend/         # SvelteKit приложение
├── shared/           # Общие типы и схемы
├── memory-bank/      # Документация проекта
└── docs/            # Техническая документация
```

## 📁 Backend структура

### Основные директории
```
backend/
├── src/
│   ├── app.ts                    # Главный файл приложения
│   ├── index.ts                  # Точка входа
│   ├── routes/                   # API роуты
│   │   ├── adminRoutes.ts        # Админские эндпоинты
│   │   └── vacancyRoutes.ts      # Публичные API вакансий
│   ├── middleware/               # Middleware функции
│   │   └── auth/                 # Аутентификация
│   │       └── firebaseAuthMiddleware.ts
│   ├── services/                 # Бизнес-логика
│   ├── repositories/             # Доступ к данным
│   ├── domain/                   # Доменные модели
│   ├── application/              # Use Cases
│   └── config/                   # Конфигурация
│       └── firebase.ts           # Firebase настройки
├── scripts/                      # Парсеры и утилиты
│   ├── fetchAndSaveFromHH.ts     # HeadHunter парсер
│   ├── fetchAndSaveFromHabr.ts   # Habr Career парсер
│   ├── fetchAndSaveFromCareered.ts # Careered.io парсер
│   └── parseTelegramUlbi.ts      # Telegram парсер
└── dist/                         # Скомпилированный код
```

### Ключевые файлы
- **`app.ts`** - Настройка Express приложения, middleware, роуты
- **`adminRoutes.ts`** - Все админские эндпоинты с аутентификацией
- **`firebaseAuthMiddleware.ts`** - Middleware для проверки Firebase токенов
- **`firebase.ts`** - Конфигурация Firebase Admin SDK

## 🎨 Frontend структура

### Основные директории
```
frontend/
├── src/
│   ├── app.html                  # HTML шаблон
│   ├── routes/                   # SvelteKit страницы
│   │   ├── admin/                # Админ панель
│   │   │   └── +page.svelte      # Главная страница админки
│   │   ├── about/                # О проекте
│   │   └── v/[id]/               # Детали вакансии
│   ├── lib/                      # Компоненты и утилиты
│   │   ├── components/           # Svelte компоненты
│   │   │   ├── admin/            # Админские компоненты
│   │   │   │   ├── ParsingActions.svelte    # Парсинг
│   │   │   │   ├── CronControls.svelte      # Управление cron
│   │   │   │   ├── AdminActions.svelte      # Админ действия
│   │   │   │   ├── SystemStats.svelte       # Статистика
│   │   │   │   └── VacancyCard.svelte       # Карточка вакансии
│   │   │   ├── auth/             # Аутентификация
│   │   │   │   └── Login.svelte              # Компонент входа
│   │   │   └── ui/               # UI компоненты
│   │   ├── api/                  # API клиенты
│   │   │   └── http.client.ts    # Централизованный HTTP клиент
│   │   ├── services/             # Сервисы
│   │   │   └── auth/             # Аутентификация
│   │   │       └── firebase.client.ts        # Firebase клиент
│   │   ├── stores/               # Svelte stores
│   │   │   ├── authStore.ts      # Состояние аутентификации
│   │   │   └── parsingLogsStore.ts # Логи парсинга
│   │   └── types/                # TypeScript типы
│   └── static/                   # Статические файлы
└── build/                        # Собранное приложение
```

### Ключевые файлы
- **`http.client.ts`** - Централизованный API клиент с аутентификацией
- **`authStore.ts`** - Управление состоянием аутентификации
- **`firebase.client.ts`** - Firebase Auth клиент
- **`admin/+page.svelte`** - Главная страница админки

## 🔧 Shared структура

```
shared/
├── src/
│   ├── types/                    # Общие TypeScript типы
│   │   ├── core/                 # Базовые типы
│   │   ├── db/                   # Модели базы данных
│   │   └── dto/                  # Data Transfer Objects
│   ├── schemas/                  # Zod схемы валидации
│   └── constants/                # Константы
└── dist/                         # Скомпилированные типы
```

## 🔐 Система аутентификации

### Frontend
- **Firebase Client SDK** - Google OAuth
- **AuthStore** - Svelte store для состояния
- **apiClient** - Автоматическая передача токенов
- **Environment** - `VITE_ADMIN_ALLOW_EMAILS` для прав

### Backend
- **Firebase Admin SDK** - Валидация JWT
- **firebaseAuthMiddleware** - Защита админских роутов
- **Environment** - `ADMIN_ALLOW_EMAILS` для доступа

## 📊 Админ панель

### Компоненты
- **ParsingActions** - Запуск парсеров, просмотр логов
- **CronControls** - Управление планировщиком
- **AdminActions** - Очистка БД, заполнение тестовыми данными
- **SystemStats** - Статистика системы
- **VacancyCard** - Управление вакансиями

### API эндпоинты
- **`/api/admin/stats`** - Статистика системы
- **`/api/admin/parse/{source}`** - Запуск парсеров
- **`/api/admin/cron/*`** - Управление cron
- **`/api/admin/vacancy/{id}`** - Удаление вакансий
- **`/api/admin/parsing-logs`** - Логи парсинга

## 🐳 Docker структура

```
├── docker-compose.yml            # Основная конфигурация
├── docker-compose.windows.yml    # Windows версия
├── Dockerfile                    # Production образ
├── Dockerfile.dev                # Development образ
├── docker.env.example            # Переменные окружения
└── start-docker.sh               # Скрипт запуска
```

### Сервисы
- **backend** - Node.js API (порт 3001)
- **frontend** - SvelteKit приложение (порт 3000)
- **mongodb** - База данных (порт 27017)

## 📚 Документация

### Memory Bank
- **`projectbrief.md`** - Общее описание проекта
- **`activeContext.md`** - Текущий статус и задачи
- **`systemPatterns.md`** - Архитектурные паттерны
- **`techContext.md`** - Технологический стек
- **`projectStructure.md`** - Структура проекта (этот файл)

### Техническая документация
- **`docs/admin-architecture.md`** - Архитектура админки
- **`docs/admin-documentation.md`** - Подробная документация
- **`docs/admin-quick-reference.md`** - Быстрая справка
- **`docs/docker-deployment.md`** - Развертывание в Docker
- **`DOCKER-README.md`** - Быстрый старт с Docker

## 🚀 Быстрый старт

### Локальная разработка
```bash
# Запуск через Docker
./start-docker.sh

# Или вручную
docker-compose --profile prod up -d
```

### Доступ к приложению
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:3000/admin

### Настройка аутентификации
1. Скопируйте `docker.env.example` в `.env`
2. Настройте Firebase проект
3. Добавьте email'ы в `ADMIN_ALLOW_EMAILS` и `VITE_ADMIN_ALLOW_EMAILS`
4. Перезапустите контейнеры

## 🔍 Поиск по кодовой базе

### Аутентификация
- **Frontend**: `frontend/src/lib/stores/authStore.ts`
- **Backend**: `backend/src/middleware/auth/firebaseAuthMiddleware.ts`
- **Config**: `backend/src/config/firebase.ts`

### API клиент
- **HTTP Client**: `frontend/src/lib/api/http.client.ts`
- **Firebase Client**: `frontend/src/lib/services/auth/firebase.client.ts`

### Админ компоненты
- **Парсинг**: `frontend/src/lib/components/admin/ParsingActions.svelte`
- **Cron**: `frontend/src/lib/components/admin/CronControls.svelte`
- **Действия**: `frontend/src/lib/components/admin/AdminActions.svelte`

### Backend роуты
- **Админ API**: `backend/src/routes/adminRoutes.ts`
- **Публичные API**: `backend/src/routes/vacancyRoutes.ts`

### Парсеры
- **HeadHunter**: `backend/scripts/fetchAndSaveFromHH.ts`
- **Habr**: `backend/scripts/fetchAndSaveFromHabr.ts`
- **Careered**: `backend/scripts/fetchAndSaveFromCareered.ts`
- **Telegram**: `backend/scripts/parseTelegramUlbi.ts`
