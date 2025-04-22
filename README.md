# 💻 JS Пульс

Автоматизированный агрегатор вакансий по Frontend/JavaScript с публикацией в Telegram и веб-лентой на Svelte.

## 🚀 О проекте

JS Пульс собирает свежие вакансии по фронтенду (Vue, React, JS и др.) с различных источников. На текущем этапе реализован базовый функционал: отображение списка вакансий из базы данных с возможностью фильтрации по навыкам.

### 🌟 Основные возможности

- Агрегация вакансий из разных источников (пока только hh.ru)
- Фильтрация по навыкам (skills)
- Удобный веб-интерфейс на SvelteKit
- REST API для работы с вакансиями
- Интеграция с Telegram (в разработке)

### 🏗 Компоненты системы

*   **Backend:** API на Node.js (Express, **TypeScript**) для управления вакансиями
*   **Frontend:** Веб-интерфейс на SvelteKit для отображения и фильтрации вакансий
*   **Database:** MongoDB для хранения данных о вакансиях
*   **Shared:** Общий пакет с типами (DTO) для backend и frontend.
*   **Seeding:** Скрипт для заполнения базы тестовыми данными
*   **Containerization:** Docker и Docker Compose для легкого запуска всего стека

---

## 🧱 Архитектура проекта

### 🧰 Используемые технологии

| Компонент        | Стек                                            | Версия | 
|------------------|-------------------------------------------------|---------|
| Backend          | Node.js (**TypeScript**), Express, Mongoose      | 20.x    | 
| Frontend         | SvelteKit, Vite, TypeScript                     | 5.x     | 
| База данных      | MongoDB                                         | 7.x     | 
| Контейнеризация  | Docker + Docker Compose                         | 3.x     | 
| Пакетный менеджер| pnpm                                            | 8.x+    | 
| Инструменты сборки| TypeScript, Vite, Nodemon, Concurrently         |         |

### 📁 Структура проекта

```
/
├── backend/                # API и логика бэкенда (TypeScript)
│   ├── data/              # Скрипты и данные для БД (Сидинг)
│   │   ├── mockVacancies.js
│   │   └── seedDatabase.js
│   ├── models/            # Модели Mongoose
│   │   ├── Vacancy.ts
│   │   └── Vacancy.d.ts
│   ├── routes/            # Маршруты Express API
│   │   └── vacancyRoutes.ts # <-- .ts
│   ├── scripts/           # Скрипты для выполнения задач (например, импорт)
│   │   └── fetchAndSaveFromHH.ts 
│   ├── utils/             # Утилитарные функции
│   │   └── transformations.ts
│   ├── config/            # Конфигурация (если нужна)
│   ├── .env.example       # Пример переменных окружения для backend
│   ├── Dockerfile
│   ├── index.ts           # <-- .ts Точка входа Express сервера
│   ├── package.json
│   └── tsconfig.json      # <-- Конфигурация TypeScript
├── frontend/               # SvelteKit интерфейс
│   ├── src/               # Исходный код
│   │   ├── api/           # Клиент API
│   │   ├── lib/           # Общие компоненты и утилиты
│   │   ├── routes/        # Страницы приложения (+page.svelte)
│   │   └── app.html
│   ├── static/            # Статические файлы
│   ├── .env.example       # Пример переменных окружения для frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── svelte.config.js
│   └── vite.config.ts
├── shared/                 # Общий код для frontend и backend
│   ├── types/             # Общие типы (DTO)
│   │   └── vacancy.dto.ts 
│   ├── index.ts           # <-- Точка входа для экспорта типов
│   ├── package.json       
│   └── tsconfig.json      # <-- Конфигурация TypeScript
├── data/                   # Данные Docker volumes (например, MongoDB)
│   └── mongo/
├── .github/                # Настройки GitHub (если используются)
│   └── workflows/
├── .cursor/                # Настройки Cursor
│   └── rules.yaml
├── .env.example            # Пример корневого файла переменных окружения
├── .gitignore
├── .dockerignore           # <-- Игнорирование файлов для Docker
├── docker-compose.yml
├── package.json            # Корневой package.json для воркспейса pnpm
├── pnpm-lock.yaml          # <-- Lock-файл pnpm
├── pnpm-workspace.yaml     # <-- Конфигурация воркспейса pnpm
└── README.md
```

### 💻 Локальная разработка (Рекомендуемый способ)

Этот способ позволяет разрабатывать **одновременно** frontend и backend с автоматической пересборкой и перезагрузкой.

1.  Убедитесь, что установлены [Node.js](https://nodejs.org/) (v20.x), [pnpm](https://pnpm.io/) (v8.x+) и [Docker](https://docs.docker.com/get-docker/).
2.  Клонируйте репозиторий и перейдите в него.
3.  Установите все зависимости воркспейса:
    ```bash
    pnpm install
    ```
4.  **Только при первом запуске или если Docker не запущен:** Запустите базу данных MongoDB в Docker:
    ```bash
    docker-compose up -d mongo 
    ```
5.  Создайте и настройте файлы `.env` (см. секцию "Переменные окружения"). Для локальной разработки убедитесь, что `backend/.env` содержит `MONGO_URL=mongodb://localhost:27017/jspulse`.
6.  Запустите всё в режиме разработки **одной командой из корня проекта**:
    ```bash
    pnpm run dev
    ```
    Эта команда использует `concurrently` для параллельного запуска:
    *   `tsc --watch` для пакета `shared` (пересборка `shared/dist` при изменениях).
    *   `nodemon` для бэкенда (пересборка и перезапуск сервера при изменениях).
    *   `vite dev` для фронтенда (dev-сервер с HMR).

📍 После запуска:

*   Бэкенд API доступен по адресу: [http://localhost:3001](http://localhost:3001)
*   Фронтенд доступен по адресу: [http://localhost:3000](http://localhost:3000)

### 🐳 Запуск всего стека в Docker

Этот способ запускает всё приложение (frontend, backend, db) в изолированных Docker-контейнерах. Удобен для production-like окружения или если не хотите настраивать Node.js/pnpm локально.

1.  Убедитесь, что установлен [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/).
2.  Клонируйте репозиторий и перейдите в него.
3.  Установите все зависимости воркспейса (нужно для pnpm): 
    ```bash
    pnpm install
    ```
4.  **Соберите общие пакеты (особенно `shared`) локально:**
    ```bash
    pnpm run build # Запустит 'pnpm -r build'
    ```
    *Зачем это нужно?* Docker монтирует вашу локальную папку `shared` в контейнеры. Чтобы frontend и backend внутри контейнеров могли использовать актуальные типы/код из `shared`, папка `shared/dist` должна быть собрана локально перед запуском.
5.  Создайте и настройте файлы `.env` (см. секцию "Переменные окружения"). Для Docker Compose `backend/.env` должен содержать `MONGO_URL=mongodb://mongo:27017/jspulse`.
6.  Запустите контейнеры (команда из корневого `package.json`):
    ```bash
    pnpm run docker:up 
    ```
    (Эта команда выполняет `pnpm run build && docker-compose up --build -d`). Ключ `--build` пересобирает образы, если Dockerfile изменился. Ключ `-d` запускает контейнеры в фоновом режиме.

📍 После запуска:

*   Бэкенд API доступен по адресу: [http://localhost:3001](http://localhost:3001)
*   Фронтенд доступен по адресу: [http://localhost:3000](http://localhost:3000)
*   База данных MongoDB доступна по адресу: `mongodb://localhost:27017` (для подключения извне контейнеров)

➡️ **Остановка Docker-контейнеров:**

```bash
pnpm run docker:down # Выполнит 'docker-compose down'
```

### 📥 Импорт вакансий с HeadHunter

Для загрузки свежих вакансий с hh.ru в базу данных выполните команду в директории `backend`:

```bash
cd backend
pnpm run fetch:hh
```
Скрипт получит вакансии, отфильтрует дубликаты и сохранит только новые.

### 🌱 Заполнение базы данных (Seeding)

При первом запуске база данных будет пустой. Чтобы заполнить ее тестовыми вакансиями, выполните команду:

```bash
docker-compose exec backend pnpm run seed
```
(Эта команда выполнит скрипт `seedDatabase.js` внутри работающего контейнера `backend`).

### 🔄 Полное обновление базы данных (Очистка + Сидинг + HH)

Для полного обновления базы данных (удаление всех старых вакансий, добавление тестовых и загрузка свежих с HH.ru) используйте команду:

```bash
docker-compose exec backend pnpm run db:refresh
```
Эта команда последовательно выполнит очистку, сидинг и загрузку с HH.ru.

---

###  環境 Переменные окружения

Проект использует файлы `.env` для конфигурации. Скопируйте соответствующие `.env.example` файлы (`/.env.example`, `/backend/.env.example`, `/frontend/.env.example`) в их оригинальные расположения (`.env`) и настройте переменные:

*   **`backend/.env`:**
    *   `MONGO_URL`: URL для подключения к MongoDB. Для **Docker Compose** используется `mongodb://mongo:27017/jspulse`, для **локального запуска** `mongodb://localhost:27017/jspulse`.
    *   `PORT` (опционально): Порт для бэкенда (по умолчанию 3001).
*   **`frontend/.env`:**
    *   `VITE_API_URL`: Полный URL бэкенд API, доступный из браузера клиента (например, `http://localhost:3001`). **Важно:** При запуске фронтенда локально, а бэкенда в Docker, используйте `http://localhost:3001`. При запуске всего в Docker, можно использовать `http://backend:3001` (если настроено в `docker-compose.yml`, как сейчас), но для единообразия лучше всегда использовать `http://localhost:3001`.
*   **`/.env` (корень):**
    *   Не используется активно, но может содержать общие переменные.

--- 

### 🧾 Git

- Используется git с самого первого этапа.
- Все временные, сгенерированные файлы и локальные конфигурации добавлены в `.gitignore`:

```gitignore
# Dependencies
node_modules/

# Build artifacts
.svelte-kit/
dist/
build/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Environment variables
.env
.env.*
!.env.example

# IDE
.cursor/
.idea/
.vscode/
*.sublime-project
*.sublime-workspace

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker data volumes
data/mongo/
```

---

## 📝 Последние изменения (Апрель 2024)

*   **Бэкенд переведен на TypeScript.**
*   **Внедрен общий пакет `shared`** для типов (DTO), используемых между frontend и backend.
*   **Обновлена структура проекта** для поддержки pnpm workspaces.
*   **Переработан процесс локальной разработки:** добавлена команда `pnpm run dev` в корне для параллельного запуска frontend, backend и watcher'а для `shared` с использованием `concurrently`.
*   **Оптимизирована конфигурация Docker Compose:** исправлено монтирование томов для корректной работы с `node_modules` и `pnpm`.
*   Исправлены ошибки импорта/экспорта типов (`VacancyDTO`).
*   Обновлены и исправлены скрипты сборки и запуска в `package.json`.
*   Улучшена обработка данных вакансий на фронтенде (отображение зарплаты, рендеринг HTML-описания).
*   Добавлены правила для AI-ассистента в `.cursor/rules.yaml`.
*   Актуализирована документация (`README.md`).

--- 

## 📌 План развития (post-MVP)

- [x] Реальные парсеры вакансий (реализован hh.ru)
- [ ] Парсеры для других источников (LinkedIn, Habr Career и т.д.)
- [ ] Интеграция с OpenAI GPT API для обработки и форматирования.
- [ ] Публикация в Telegram-канал и бот.
- [ ] Email-рассылка / RSS.
- [ ] Telegram-админка.
- [ ] Подписки на теги.
- [ ] Обратная связь в боте (лайк/дизлайк).
- [ ] Хостинг на Render/VPS/Cloudflare.
- [ ] Пагинация в скрипте импорта HH.ru.

---

## ✍️ Автор

Разработка: **@antonGolova**  
Для связи: [Telegram](https://t.me/antonGolova)  
LinkedIn: [Anton Golova](https://www.linkedin.com/in/antongolova)  
Репозиторий: [GitHub](https://github.com/scoutrul/jspulse)
