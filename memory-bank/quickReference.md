# JSPulse - Быстрая справка

## 🚀 Быстрый старт
```bash
# Запуск проекта
./start-docker.sh

# Или вручную
docker-compose --profile prod up -d
```

## 🔗 Доступ к приложению
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:3000/admin

## 🔐 Аутентификация в админке
1. Откройте http://localhost:3000/admin
2. Нажмите "Войти" в хедере
3. Войдите через Google
4. Убедитесь, что ваш email в `VITE_ADMIN_ALLOW_EMAILS`

## 📁 Ключевые файлы

### Аутентификация
- **Frontend**: `frontend/src/lib/stores/authStore.ts`
- **Backend**: `backend/src/middleware/auth/firebaseAuthMiddleware.ts`
- **API Client**: `frontend/src/lib/api/http.client.ts`

### Админ компоненты
- **Парсинг**: `frontend/src/lib/components/admin/ParsingActions.svelte`
- **Cron**: `frontend/src/lib/components/admin/CronControls.svelte`
- **Действия**: `frontend/src/lib/components/admin/AdminActions.svelte`
- **Статистика**: `frontend/src/lib/components/admin/SystemStats.svelte`

### Backend API
- **Админ роуты**: `backend/src/routes/adminRoutes.ts`
- **Публичные API**: `backend/src/routes/vacancyRoutes.ts`
- **Firebase config**: `backend/src/config/firebase.ts`

### Парсеры
- **HeadHunter**: `backend/scripts/fetchAndSaveFromHH.ts`
- **Habr**: `backend/scripts/fetchAndSaveFromHabr.ts`
- **Careered**: `backend/scripts/fetchAndSaveFromCareered.ts`
- **Telegram**: `backend/scripts/parseTelegramUlbi.ts`

## 🛠️ Команды разработки

### Frontend
```bash
cd frontend
pnpm run dev          # Разработка
pnpm run build        # Сборка
pnpm run preview      # Предпросмотр
```

### Backend
```bash
cd backend
pnpm run dev          # Разработка
pnpm run build        # Сборка
pnpm run start        # Запуск
```

### Docker
```bash
# Запуск
docker-compose --profile prod up -d

# Логи
docker-compose --profile prod logs -f

# Остановка
docker-compose --profile prod down

# Пересборка
docker-compose --profile prod build
```

## 🔧 Переменные окружения

### Обязательные для админки
```bash
# Backend
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_ALLOW_EMAILS=admin@example.com,another@example.com

# Frontend
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_ADMIN_ALLOW_EMAILS=admin@example.com,another@example.com
```

## 🚨 Устранение неполадок

### Ошибка 401 в админке
- Проверьте настройки Firebase в `.env`
- Убедитесь, что email в `VITE_ADMIN_ALLOW_EMAILS`
- Перезапустите контейнеры после изменения `.env`

### Парсеры не работают
- Убедитесь, что backend собран: `pnpm run build`
- Проверьте логи: `docker-compose logs backend`

### База данных
- Проверьте MongoDB: `docker-compose ps`
- Логи MongoDB: `docker-compose logs mongodb`

## 📊 Админ функции

### Парсинг
- **Habr Career** - Парсинг с habr.ru/career
- **HeadHunter** - Парсинг с hh.ru
- **Careered** - Парсинг с careered.io
- **Telegram** - Парсинг каналов

### Управление
- **Cron** - Планировщик задач
- **Статистика** - Количество вакансий и навыков
- **Логи** - Мониторинг в реальном времени
- **Вакансии** - Удаление вакансий

## 📚 Документация
- **Структура проекта**: `memory-bank/projectStructure.md`
- **Архитектура**: `memory-bank/systemPatterns.md`
- **Технологии**: `memory-bank/techContext.md`
- **Текущий статус**: `memory-bank/activeContext.md`
- **Админ справка**: `docs/admin-quick-reference.md`
- **Docker**: `DOCKER-README.md`
