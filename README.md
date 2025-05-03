# 💻 JS Пульс

Автоматизированный агрегатор вакансий по Frontend/JavaScript с публикацией в Telegram и веб-лентой на Svelte.

## 🚀 О проекте

JS Пульс собирает свежие вакансии по фронтенду (Vue, React, JS и др.) с различных источников. На текущем этапе реализован базовый функционал: отображение списка вакансий из базы данных с возможностью фильтрации по навыкам.

### 🌟 Основные возможности

- Агрегация вакансий из разных источников (пока только hh.ru)
- **Отображение списка вакансий с фильтрацией по навыкам** (ключевые слова, теги).
- **Просмотр детальной информации по каждой вакансии** на отдельной странице.
- Удобный **компонентный веб-интерфейс** на SvelteKit.
- REST API для работы с вакансиями.
- Интеграция с Telegram (в разработке)

### 🏗 Компоненты системы

- **Backend:** API на Node.js (Express, **TypeScript**) для управления вакансиями
- **Frontend:** Веб-интерфейс на SvelteKit для отображения и фильтрации вакансий
- **Database:** MongoDB для хранения данных о вакансиях
- **Shared:** Общий пакет с типами (DTO) для backend и frontend.
- **Seeding:** Скрипт для заполнения базы тестовыми данными
- **Containerization:** Docker и Docker Compose для легкого запуска всего стека

## 🛠️ Стек технологий по сервисам

- **`backend`**
  - **Node.js & TypeScript:** Основа для серверной логики.
  - **Express:** Минималистичный веб-фреймворк для создания API.
  - **Mongoose:** ODM для удобной работы с MongoDB.
  - **dotenv:** Загрузка переменных окружения из `.env`.
  - **Ky:** HTTP-клиент для запросов к внешним API (например, HH.ru).
- **`frontend`**
  - **SvelteKit & Svelte:** Современный фреймворк для создания реактивных пользовательских интерфейсов.
  - **Vite:** Быстрый сборщик для разработки и продакшена.
  - **TypeScript:** Статическая типизация для улучшения надежности кода.
  - **Ky:** HTTP-клиент для запросов к backend API.
  - **Tailwind CSS:** Утилитарный CSS-фреймворк для стилизации.
- **`shared`**
  - **TypeScript:** Используется исключительно для определения общих типов данных, используемых `backend` и `frontend`. Не содержит исполняемой логики.

### 💾 Сериализация и обмен данными

- **Формат обмена:** Между frontend и backend используется формат JSON.
- **Backend:**
  - Middleware `express.json()` используется для автоматической десериализации входящих JSON-запросов в JavaScript-объекты (в `req.body`).
  - Перед отправкой данных на frontend, они обычно преобразуются в формат Data Transfer Object (DTO), определенный в пакете `shared/types/dto/`. Это гарантирует четкий контракт данных между клиентом и сервером.
  - Mongoose модели (`backend/models/`) могут содержать больше полей, чем необходимо на frontend. Преобразование в DTO позволяет отфильтровать лишние данные (например, `rawData`) и при необходимости изменить формат полей (например, `Date` в строку ISO).
  - Ответы клиенту сериализуются обратно в JSON с помощью `res.json()`.
- **Frontend:**
  - Получает JSON от API и десериализует его в JavaScript-объекты, типизированные с использованием тех же DTO из `shared/types/dto/`.
- **Shared DTO:** Использование общих DTO в `shared/` пакете обеспечивает консистентность типов и структуры данных между backend и frontend, упрощая разработку и уменьшая количество ошибок.

### 📦 Структура типов и взаимодействие между пакетами

В проекте используется монорепозиторий с тремя основными пакетами:

- `@jspulse/shared` - общие типы и интерфейсы
- `@jspulse/backend` - бэкенд сервер на Express
- `@jspulse/frontend` - фронтенд на SvelteKit

**Важно!** Для корректной работы с типами:

1. Все **общие типы** должны быть определены в пакете `@jspulse/shared` в директории `dist/types/`.
2. Файлы внутри `shared/dist` уже готовы к использованию и **не требуют транспиляции**.
3. При изменении типов в `shared` пакете:
   - Внесите изменения в соответствующие файлы в `shared/src/types/`
   - Выполните команду `pnpm run build` в корне проекта или `pnpm --filter @jspulse/shared run build` для обновления `shared/dist/`
   - Изменения будут скопированы в директорию `dist`, и станут доступны для других пакетов
   - Перезапустите сервер разработки (`pnpm run dev`), если он был запущен
4. Как работает импорт типов:
   - В backend и frontend пакетах типы импортируются с помощью `import { ... } from "@jspulse/shared"`
   - Для этого импорта используется настройка workspaces в pnpm и ссылки в package.json (используется `"workspace:*"`)

---

## 🧱 Архитектура проекта

### 🧰 Используемые технологии

| Компонент               | Стек                                                                          | Версия |
| ----------------------- | ----------------------------------------------------------------------------- | ------ |
| Backend                 | Node.js (**TypeScript**), Express, Mongoose                                   | 20.x   |
| Frontend                | SvelteKit, Vite, TypeScript, **Skeleton UI**                                  | 5.x    |
| База данных             | MongoDB                                                                       | 7.x    |
| Контейнеризация         | Docker + Docker Compose                                                       | 3.x    |
| Пакетный менеджер       | pnpm                                                                          | 8.x+   |
| Инструменты сборки и DX | TypeScript, Vite, Nodemon, Concurrently, ESLint, Prettier, Husky, lint-staged |        |

### 📁 Структура проекта

```
/
├── backend/                # API и логика бэкенда (TypeScript)
│   ├── data/              # Скрипты и данные для БД (Сидинг)
│   │   ├── mockVacancies.js
│   │   └── seedDatabase.ts # <-- .ts
│   ├── models/            # Модели Mongoose
│   │   └── Vacancy.ts     # <-- .ts (Модель и схема)
│   ├── routes/            # Маршруты Express API
│   │   └── vacancyRoutes.ts
│   ├── scripts/           # Скрипты для выполнения задач (например, импорт)
│   │   ├── clearDatabase.ts # <-- .ts
│   │   └── fetchAndSaveFromHH.ts
│   ├── utils/             # Утилитарные функции
│   │   └── transformations.ts
│   ├── config/            # Конфигурация (если нужна)
│   ├── .env.example       # Пример переменных окружения для backend
│   ├── Dockerfile
│   ├── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # SvelteKit интерфейс
│   ├── src/               # Исходный код
│   │   ├── api/           # Клиент API (http.client.ts)
│   │   ├── lib/           # Общие компоненты и утилиты
│   │   │   ├── components/ # <-- UI Компоненты (Filters, VacancyCard и т.д.)
│   │   │   └── utils/
│   │   ├── routes/        # Страницы приложения (+page.svelte, /v/[id]/+page.svelte)
│   │   └── app.html
│   ├── static/            # Статические файлы
│   ├── .env.example       # Пример переменных окружения для frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── svelte.config.js
│   └── vite.config.ts
├── shared/                 # Общий код для frontend и backend
│   ├── src/               # Исходные файлы TypeScript
│   │   └── types/        # Типы и интерфейсы
│   │       ├── core/     # Базовые типы
│   │       ├── db/       # Типы для Mongoose-моделей 
│   │       ├── dto/      # Data Transfer Objects для API
│   │       ├── sources/  # Типы для внешних источников (HH.ru)
│   │       └── index.ts  # Публичные экспорты типов
│   ├── dist/             # Скомпилированные файлы (включены в Git!)
│   │   └── types/       # Скомпилированные типы (.js и .d.ts)
│   ├── scripts/          # Скрипты для сборки
│   │   └── build.js     # Скрипт для копирования и обработки файлов
│   ├── package.json      # Зависимости и скрипты
│   └── tsconfig.json     # Конфигурация TypeScript
├── data/                   # Данные Docker volumes (например, MongoDB)
│   └── mongo/
├── .github/                # Настройки GitHub (если используются)
│   └── workflows/
├── .cursor/                # Настройки Cursor
│   └── rules.yaml
├── .env.example            # Пример корневого файла переменных окружения
├── .gitignore              # Исключения Git (с исключением для shared/dist!)
├── .dockerignore
├── docker-compose.yml
├── package.json            # Корневой package.json для воркспейса pnpm
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

### 💻 Локальная разработка (Рекомендуемый способ)

1. **Подготовка окружения**

   ```bash
   # Установка зависимостей
   pnpm install

   # Создание .env файлов из примеров
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```

2. **Запуск MongoDB в Docker**

   ```bash
   # Запуск только базы данных
   docker compose up -d mongo
   ```

3. **Сборка shared пакета**

   ```bash
   # Сборка общих типов
   pnpm --filter @jspulse/shared run build
   # или
   pnpm run build # в корне проекта
   ```
   
   Эта команда запускает скрипт `build.js`, который:
   - Копирует файлы из `shared/src/` в `shared/dist/`
   - Создает `.js` и `.d.ts` файлы для каждого `.ts` файла
   - Обрабатывает импорты для корректной работы в JavaScript

4. **Режим разработки**
   ```bash
   # Запуск всех сервисов в режиме разработки
   pnpm run dev
   ```
   Эта команда запускает параллельно:
   - Watcher для `shared` (пересборка при изменении типов)
   - Backend на Express (автоперезагрузка при изменениях)
   - Frontend на SvelteKit (HMR)

📍 После запуска:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)
- MongoDB: `mongodb://localhost:27017`

5. **Заполнение базы данных (опционально)**

   ```bash
   # Тестовые данные
   pnpm --filter @jspulse/backend run db:seed

   # Импорт с HH.ru
   pnpm --filter @jspulse/backend run db:hh
   ```

⚠️ **Важные замечания:**

- При изменении типов в `shared` пакете требуется его пересборка
- Если изменения в типах не отражаются или VS Code/Cursor показывает ошибки:
  1. Убедитесь, что выполнили пересборку: `pnpm run build`
  2. Перезапустите TypeScript сервер в редакторе (F1 → "TypeScript: Restart TS server")
  3. При необходимости перезапустите сервер разработки: `pnpm run dev`
  4. Файлы в директории `shared/dist/` должны быть включены в Git-репозиторий

### 🐳 Запуск всего стека в Docker

Этот способ запускает всё приложение (frontend, backend, db) в изолированных Docker-контейнерах. Удобен для production-like окружения или если не хотите настраивать Node.js/pnpm локально.

1.  Убедитесь, что установлен [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/).
2.  Клонируйте репозиторий и перейдите в него.
3.  Установите все зависимости воркспейса (это нужно для копирования `node_modules` в образ, если используется `COPY --link`):
    ```bash
    pnpm install
    ```
4.  Создайте и настройте файлы `.env` (см. секцию "Переменные окружения"). Для Docker Compose `backend/.env` должен содержать `MONGO_URI=mongodb://mongo:27017/jspulse`.
5.  Запустите контейнеры (команда из корневого `package.json`):
    ```bash
    pnpm run docker:up
    # или
    docker compose up --build -d
    ```
    (Эта команда выполняет `docker-compose up --build -d`). Ключ `--build` пересобирает образы, если Dockerfile изменился. Ключ `-d` запускает контейнеры в фоновом режиме.

📍 После запуска:

- Бэкенд API доступен по адресу: [http://localhost:3001](http://localhost:3001)
- Фронтенд доступен по адресу: [http://localhost:3000](http://localhost:3000)
- База данных MongoDB доступна по адресу: `mongodb://localhost:27017` (для подключения извне контейнеров)

➡️ **Остановка Docker-контейнеров:**

```bash
pnpm run docker:down # Выполнит 'docker-compose down'
```

### 🌱 Заполнение базы данных (Seeding)

При первом запуске или для заполнения тестовыми вакансиями:

```bash
docker compose exec backend pnpm run seed:run
```

### 📥 Импорт вакансий с HeadHunter

Для загрузки свежих вакансий с hh.ru в базу данных:

```bash
docker compose exec backend pnpm run fetch:hh:run
```

Скрипт получит вакансии, отфильтрует дубликаты и сохранит только новые.

### 🧹 Очистка базы данных

Для удаления всех вакансий из базы:

```bash
docker compose exec backend pnpm run clear:db:run
```

### 🔄 Полное обновление базы данных (Очистка + Сидинг + HH)

Для полного обновления базы данных (удаление всех старых вакансий, добавление тестовых и загрузка свежих с HH.ru) используйте команду:

```bash
docker compose exec backend pnpm run db:refresh
```

Эта команда последовательно выполнит очистку, сидинг и загрузку с HH.ru.

---

### 🔑 Переменные окружения

В проекте используются следующие переменные окружения:

#### Frontend (frontend/.env)

```env
# URL для клиентских запросов (из браузера)
VITE_PUBLIC_BACKEND_URL=http://localhost:3001

# URL для серверных запросов (из SvelteKit SSR)
INTERNAL_BACKEND_URL=http://localhost:3001
```

В Docker Compose эти значения переопределяются:

- `VITE_PUBLIC_BACKEND_URL` остается `http://localhost:3001` (для браузера)
- `INTERNAL_BACKEND_URL` меняется на `http://backend:3001` (для межсервисного взаимодействия)

#### Backend (backend/.env)

```env
# URL для подключения к MongoDB
MONGO_URI=mongodb://localhost:27017/jspulse  # для локальной разработки
# MONGO_URI=mongodb://mongo:27017/jspulse    # для Docker Compose

# Порт для запуска сервера
PORT=3001

# Настройки для работы с HH.ru API (опционально)
HH_API_URL=https://api.hh.ru
HH_USER_AGENT=JSPulse/1.0 (nikita@tonsky.me)
```

### 🌐 Настройка URL для взаимодействия с бэкендом

В проекте используется два типа URL для взаимодействия с бэкендом:

1. **Клиентские запросы** (из браузера):

   - Используют `VITE_PUBLIC_BACKEND_URL`
   - Всегда идут через публичный URL (например, `http://localhost:3001`)
   - Настраиваются в `frontend/src/lib/api/http.client.ts`

2. **Серверные запросы** (из SvelteKit SSR):
   - Используют `INTERNAL_BACKEND_URL`
   - В Docker используют внутреннее имя сервиса (`http://backend:3001`)
   - В режиме разработки используют localhost
   - Настраиваются в `frontend/src/lib/api/http.server.ts`

Если переменные окружения не заданы, используются значения по умолчанию:

- В режиме разработки: `http://localhost:3001`
- В консоль выводятся предупреждения о незаданных переменных

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

## 📝 Последние изменения (Апрель/Май 2024)

- **Бэкенд переведен на TypeScript.**
- **Внедрен общий пакет `shared`** для типов (DTO), используемых между frontend и backend.
- **Проведена реструктуризация пакета `shared`:**
  - Создана четкая структура каталогов `src/types/` с разделением на core, db, dto и sources
  - Разработан скрипт сборки для генерации `.js` и `.d.ts` файлов
  - Настроена корректная работа с Git (включая `dist/` в репозиторий)
  - Улучшен процесс импорта типов между пакетами
- **Обновлена структура проекта** для поддержки pnpm workspaces.
- **Переработан процесс локальной разработки:** добавлена команда `pnpm run dev` в корне для параллельного запуска frontend, backend и watcher'а для `shared` с использованием `concurrently`.
- **Оптимизирована конфигурация Docker Compose:** исправлено монтирование томов, порты и переменные окружения.
- **Проведен рефакторинг главной страницы (`+page.svelte`)**: интерфейс разбит на переиспользуемые UI-компоненты (`Filters`, `VacancyList`, `VacancyCard`, `LoadMoreButton`, `LoadingIndicator`, `ErrorMessage`), размещенные в `src/lib/components/`.
- **Реализована страница детального просмотра вакансии (`/v/[id]/+page.svelte`)** с загрузкой данных через `+page.server.ts`.
- **Axios заменен на Ky** на фронтенде, API клиент (`http.client.ts`) рефакторен для корректной обработки ответов и ошибок.
- Исправлены ошибки импорта/экспорта и использования типов (`VacancyDTO`) на фронтенде.
- Улучшена обработка данных вакансий на фронтенде (отображение зарплаты, рендеринг HTML-описания).
- Добавлены правила для AI-ассистента в `.cursor/rules.yaml`.
- Актуализирована документация (`README.md`).
- Проведена очистка кода от неиспользуемых переменных и избыточных комментариев.

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

### 🧬 Структура типов в `shared`

Пакет `shared` содержит типизацию данных, используемую во всем проекте. В результате реструктуризации мы создали четкое разделение между исходными файлами TypeScript в директории `src/` и скомпилированными файлами в директории `dist/`.

```
shared/
├── src/                # Исходные файлы TypeScript
│   └── types/         # Типы и интерфейсы
│       ├── core/      # Базовые типы (например, BaseVacancy)
│       ├── sources/   # Типы данных от внешних API (например, HH)
│       ├── db/        # Типы для Mongoose-моделей
│       └── dto/       # Data Transfer Objects для API
├── dist/              # Скомпилированные файлы (JS + .d.ts)
│   └── types/        # Скомпилированные типы
├── scripts/           # Скрипты для сборки
│   └── build.js       # Скрипт для копирования и обработки файлов
├── package.json       # Зависимости и скрипты
└── tsconfig.json     # Конфигурация TypeScript
```

**Ключевые особенности обновленной структуры:**

- **Исходные файлы TypeScript** хранятся в директории `src/` в их естественном виде с расширением `.ts`.
- **Скомпилированные файлы** (`.js` и `.d.ts`) размещаются в директории `dist/` с сохранением структуры каталогов.
- **Директория `dist/`** теперь включается в Git (исключение в `.gitignore`: `!shared/dist/`), что позволяет использовать пакет как зависимость без необходимости сборки при каждой установке.
- **Скрипт сборки** (`scripts/build.js`) выполняет следующие действия:
  - Очищает директорию `dist/`
  - Для каждого `.ts` файла создает соответствующие `.js` и `.d.ts` файлы
  - Обрабатывает импорты, корректируя пути для корректной работы в JavaScript
  - Сохраняет структуру каталогов и вложенных директорий

**Процесс работы с типами:**

1. **Редактирование типов:**
   - Все изменения выполняются в файлах директории `src/`
   - Организация типов следует четкой структуре: core, db, dto, sources

2. **Сборка типов:**
   - После внесения изменений запустите `pnpm run build` в корне проекта или `pnpm --filter @jspulse/shared run build`
   - Скрипт сборки автоматически создаст все необходимые `.js` и `.d.ts` файлы в директории `dist/`

3. **Использование типов:**
   - В backend и frontend пакетах типы импортируются как `import { ... } from "@jspulse/shared"`
   - Благодаря настройкам в `package.json` и `tsconfig.json` импорты разрешаются корректно

**Преимущества новой структуры:**

- Четкое разделение исходного кода и скомпилированных файлов
- Отсутствие дублирования кода и типов
- Единый источник правды для типов
- Простой процесс сборки
- Включение `dist/` в Git для удобства разработки

**Примечание:** При изменении типов в пакете `shared`, рекомендуется перезапустить TypeScript Language Server в редакторе кода, если VS Code/Cursor показывает ошибки типов после пересборки пакета.

---

### 🧾 Линтинг и форматирование

Проект использует [ESLint](https://eslint.org/) для линтинга кода и [Prettier](https://prettier.io/) для форматирования, с единой конфигурацией для всего pnpm воркспейса (`backend`, `frontend`, `shared`).

**Инструменты и конфигурация:**

- **ESLint:** Настроен для проверки JavaScript, TypeScript (`.ts`) и Svelte (`.svelte`) файлов. Использует рекомендованные правила от `eslint`, `@typescript-eslint`, `eslint-plugin-svelte` и интегрирован с Prettier (`eslint-plugin-prettier`, `eslint-config-prettier`). Конфигурация находится в корневом файле `.eslintrc.js`.
  - **Правило комментирования:** Избегайте очевидных комментариев, которые просто повторяют код (например, `// Делаем запрос с помощью ky`). Комментарии должны объяснять _зачем_ или _почему_ написан код, а не _что_ он делает, если это не требует пояснений.
- **Prettier:** Обеспечивает единый стиль кода. Конфигурация находится в корневом файле `.prettierrc.js`. Используется плагин `prettier-plugin-svelte` для корректного форматирования `.svelte` файлов.
- **Игнорирование:** Файлы и директории, которые не должны проверяться/форматироваться, указаны в `.prettierignore` и в секции `ignorePatterns` файла `.eslintrc.js`.
- **Интеграция с IDE (VSCode/Cursor):** Файл `.vscode/settings.json` содержит рекомендуемые настройки для автоматической проверки ESLint и форматирования Prettier при сохранении файлов. Убедитесь, что у вас установлены расширения [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) и [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

**Команды (запускать из корня проекта):**

- **Проверка линтером:**

  ```bash
  pnpm run lint
  ```

  Запускает ESLint для проверки всех `.js`, `.ts`, `.svelte` файлов в проекте.

- **Автоматическое исправление ошибок линтера:**

  ```bash
  pnpm run lint:fix
  ```

  Запускает ESLint в режиме исправления ошибок (где это возможно).

- **Форматирование кода:**
  ```bash
  pnpm run format
  ```
  Запускает Prettier для форматирования всех поддерживаемых файлов в проекте согласно правилам в `.prettierrc.js`.

**Проверка перед коммитом (Pre-commit Hook):**

Для обеспечения качества кода перед каждым коммитом настроен Git-хук с использованием [Husky](https://typicode.github.io/husky/) и [lint-staged](https://github.com/okonet/lint-staged):

- Перед выполнением `git commit` автоматически запускается `lint-staged`.
- `lint-staged`
