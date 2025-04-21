# 💻 JS Пульс

Автоматизированный агрегатор вакансий по Frontend/JavaScript с публикацией в Telegram и веб-лентой на Svelte.

## 🚀 О проекте

JS Пульс собирает свежие вакансии по фронтенду (Vue, React, JS и др.) с различных источников. На текущем этапе реализован базовый функционал: отображение списка вакансий из базы данных с возможностью фильтрации по тегам.

### 🌟 Основные возможности

- Агрегация вакансий из разных источников
- Фильтрация по тегам и технологиям
- Удобный веб-интерфейс на SvelteKit
- REST API для работы с вакансиями
- Интеграция с Telegram (в разработке)

### 🏗 Компоненты системы

*   **Backend:** API на Node.js (Express) для управления вакансиями
*   **Frontend:** Веб-интерфейс на SvelteKit для отображения и фильтрации вакансий
*   **Database:** MongoDB для хранения данных о вакансиях
*   **Seeding:** Скрипт для заполнения базы тестовыми данными
*   **Containerization:** Docker и Docker Compose для легкого запуска всего стека

---

## 🧱 Архитектура проекта

### 🧰 Используемые технологии

| Компонент        | Стек                         | Версия |
|------------------|------------------------------|---------|
| Backend          | Node.js (Express), Mongoose  | 18.x    |
| Frontend         | SvelteKit, Vite             | 4.x     |
| База данных      | MongoDB                     | 7.x     |
| Контейнеризация  | Docker + Docker Compose     | 3.x     |
| Пакетный менеджер| pnpm                        | 8.x     |

### 📁 Структура проекта

```
/
├── backend/                # API и логика бэкенда
│   ├── data/              # Скрипты и данные для БД
│   │   ├── mockVacancies.js
│   │   └── seedDatabase.js
│   ├── models/            # Модели Mongoose
│   │   └── Vacancy.js
│   ├── routes/            # Маршруты Express API
│   │   └── vacancyRoutes.js
│   ├── middleware/        # Middleware Express
│   │   ├── errorHandler.js
│   │   └── auth.js
│   ├── services/          # Бизнес-логика
│   │   └── vacancy.service.js
│   ├── config/           # Конфигурация
│   │   └── database.js
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── index.js          # Express сервер
│   └── package.json
├── frontend/             # SvelteKit интерфейс
│   ├── src/             # Исходный код
│   │   ├── lib/         # Общие компоненты и утилиты
│   │   │   ├── components/
│   │   │   │   ├── Header.svelte
│   │   │   │   └── VacancyCard.svelte
│   │   │   └── utils/
│   │   │       └── date.ts
│   │   ├── services/    # Сервисный слой
│   │   │   └── vacancy.service.ts
│   │   ├── types/      # TypeScript типы
│   │   │   └── vacancy.types.ts
│   │   ├── routes/     # Страницы приложения
│   │   │   ├── +page.svelte
│   │   │   └── +layout.svelte
│   │   └── app.html
│   ├── static/          # Статические файлы
│   │   ├── favicon.ico
│   │   └── jspulse.png
│   ├── tests/          # Тесты
│   │   └── vacancy.test.ts
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── svelte.config.js
│   └── vite.config.ts
├── shared/             # Общий код для frontend и backend
│   ├── constants/
│   │   └── tags.ts
│   └── types/
│       └── index.ts
├── data/              # Данные Docker volumes
│   └── mongo/
├── .github/          # GitHub Actions
│   └── workflows/
│       └── ci.yml
├── .env.example      # Пример переменных окружения
├── .gitignore
├── docker-compose.yml
├── package.json
└── README.md
```

### ⚙️ Запуск проекта (с помощью Docker)

Это рекомендуемый способ для быстрого запуска всего приложения.

1.  Убедитесь, что установлен [Docker](https://docs.docker.com/get-docker/) и [Docker Compose](https://docs.docker.com/compose/install/).
2.  Клонируйте репозиторий:
    ```bash
    git clone https://github.com/ваш-логин/jspulse.git # Замените на ваш URL
    cd jspulse
    ```
3.  Создайте файл `.env` на основе `.env.example` и заполните необходимые переменные окружения (если они есть).
    ```bash
    cp .env.example .env
    ```
4.  Запустите контейнеры:
    ```bash
    docker-compose up --build -d
    ```
    Ключ `--build` нужен при первом запуске или после изменения `Dockerfile`. Ключ `-d` запускает контейнеры в фоновом режиме.

📍 После запуска:

*   Бэкенд API доступен по адресу: [http://localhost:3001](http://localhost:3001)
*   Фронтенд доступен по адресу: [http://localhost:3000](http://localhost:3000)
*   База данных MongoDB доступна по адресу: `mongodb://localhost:27017` (для подключения извне контейнеров)

### 🌱 Заполнение базы данных (Seeding)

При первом запуске база данных будет пустой. Чтобы заполнить ее тестовыми вакансиями, выполните команду:

```bash
docker-compose exec backend node data/seedDatabase.js
```

Эта команда выполнит скрипт `seedDatabase.js` внутри работающего контейнера `backend`.

### 💻 Локальная разработка Frontend

Если вы хотите разрабатывать фронтенд локально (с горячей перезагрузкой), не используя Docker для фронтенда:

1.  Убедитесь, что запущены контейнеры `mongo` и `backend` (см. раздел "Запуск проекта").
2.  Перейдите в директорию `frontend`:
    ```bash
    cd frontend
    ```
3.  Установите зависимости (если еще не установлены):
    ```bash
    pnpm install
    ```
4.  Запустите dev-сервер SvelteKit:
    ```bash
    pnpm run dev
    ```
5.  Фронтенд будет доступен по адресу, указанному в терминале (обычно [http://localhost:5173](http://localhost:5173) или другой порт, если 3000 занят Docker).

---

###  環境 Переменные окружения

Проект использует файл `.env` для конфигурации. Скопируйте `.env.example` в `.env` и настройте переменные:

*   `MONGO_URL`: URL для подключения к MongoDB. Для Docker Compose используется `mongodb://mongo:27017/jspulse`, для локального запуска `mongodb://localhost:27017/jspulse`.
*   `PORT`: Порт, на котором будет работать бэкенд (по умолчанию 3001).

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

## 📝 Последние изменения

### Бэкенд
- Обновлены основные зависимости
- Оптимизирована конфигурация сервера
- Улучшена обработка ошибок в API

### Фронтенд
- Добавлен сервисный слой для работы с API
- Обновлены зависимости и главная страница
- Улучшена производительность и UX
- Обновлена конфигурация Vite для лучшей совместимости

### Общие улучшения
- Улучшена документация проекта
- Оптимизирована структура кода
- Добавлены новые типы для TypeScript

---

## 📌 План развития (post-MVP)

- Реальные парсеры вакансий.
- Интеграция с OpenAI GPT API для обработки и форматирования.
- Публикация в Telegram-канал и бот.
- Email-рассылка / RSS.
- Telegram-админка.
- Подписки на теги.
- Обратная связь в боте (лайк/дизлайк).
- Хостинг на Render/VPS/Cloudflare.

---

## ✍️ Автор

Разработка: **@antonGolova**  
Для связи: [Telegram](https://t.me/antonGolova)  
LinkedIn: [Anton Golova](https://www.linkedin.com/in/antongolova)  
Репозиторий: [GitHub](https://github.com/scoutrul/jspulse)
