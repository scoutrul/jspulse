# 💻 JS Пульс

Автоматизированный агрегатор вакансий по Frontend/JavaScript с публикацией в Telegram и веб-лентой на Svelte.

## 🚀 О проекте

JS Пульс собирает свежие вакансии по фронтенду (Vue, React, JS и др.) с различных источников: job-сайтов, Telegram-каналов и т.д.  
Форматирует их с помощью GPT-API и публикует в:

- Telegram-канал (Markdown/HTML-оформление)
- Telegram-бота с фильтрами по тегам
- Веб-интерфейс с фильтрацией, пагинацией и тегами

---

## 🧱 Архитектура проекта

### 🔎 Парсеры (data collectors)
- Источники: hh.ru, remoteok, Telegram-каналы и др.
- Выход: «сырая» вакансия (json с текстом, ссылкой, датой)

### 🤖 Обработка вакансий (GPT-API)
- Форматирование: title, описание, требования, теги, стек, локация
- Выход: нормализованный JSON-объект

### 💾 База данных
- MongoDB (через Docker)
- Коллекция `vacancies`:
  ```json
  {
    _id,
    title,
    tags: [],
    url,
    description,
    html,
    source,
    publishedAt,
    isSentToTG
  }
  ```

### 📬 Telegram-бот и канал
- Публикация в канал (Telegraf.js или node-telegram-bot-api)
- Бот-команды:
  - `/last`
  - `/vue`
  - `/remote junior`
  - `/help`

### 🌐 Web-интерфейс (SvelteKit)
- Лента вакансий с фильтрацией по тегам
- SSR-рендеринг с данными из базы
- Пагинация, простые фильтры

---

## 🧪 Этап 1: Локальное окружение (MVP)

**Цель:** поднять локально инфраструктуру проекта без бизнес-логики.

### 🧰 Используемые технологии

| Компонент     | Стек                         |
|---------------|------------------------------|
| Backend       | Node.js (Express)            |
| Frontend      | SvelteKit                    |
| База данных   | MongoDB                      |
| Контейнеризация | Docker + Docker Compose     |
| Обработка     | OpenAI GPT API               |
| Бот           | Telegraf.js или node-telegram-bot-api |

### 📁 Структура проекта

```
/
├── backend/       # API и логика парсера
│   └── Dockerfile
├── frontend/      # SvelteKit интерфейс
│   └── Dockerfile
├── mongo/         # MongoDB контейнер
├── .env
├── .gitignore
├── docker-compose.yml
└── README.md
```

### ⚙️ Запуск проекта

1. Убедитесь, что установлен Docker и Docker Compose
2. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/your-username/js-puls.git
   cd js-puls
   ```
3. Создайте `.env` файл (см. `.env.example`)
4. Запустите контейнеры:
   ```bash
   docker-compose up --build
   ```

📍 После запуска:

- Бэкенд: [http://localhost:4000](http://localhost:4000)
- Фронтенд: [http://localhost:3000](http://localhost:3000)
- MongoDB доступна на `localhost:27017`

### 🧾 Git

- Используется git с самого первого этапа
- Все временные и сгенерированные файлы добавлены в `.gitignore`:
  ```
  node_modules/
  .env
  dist/
  *.log
  mongo/data/
  ```

---

## 📌 В будущем (post-MVP)

- Email-рассылка / RSS
- Telegram-админка
- Подписки на теги
- Обратная связь в боте (лайк/дизлайк)
- Интеграция с Supabase / PlanetScale (опционально)
- Хостинг на Render/VPS/Cloudflare

---

## ✍️ Автор

Разработка: **@antonGolova**  
Для связи: [Telegram](https://t.me/antonGolova)
LinkedIn: [Anton Golova](https://www.linkedin.com/in/antongolova)
Репозиторий: [GitHub](https://github.com/scoutrul/jspulse)
# jspulse
