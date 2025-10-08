# JSPulse Docker Deployment Guide

## Обзор

Этот гайд описывает развертывание JSPulse с административной панелью через Docker. Система включает в себя:

- **Backend** (Express.js + TypeScript) - API и парсеры
- **Frontend** (SvelteKit) - веб-интерфейс и админка
- **MongoDB** - база данных
- **Firebase Auth** - аутентификация для админки

## Быстрый старт

### 1. Подготовка окружения

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd jspulse

# Скопируйте файл с переменными окружения
cp docker.env.example .env

# Отредактируйте .env файл с вашими настройками
nano .env
```

### 2. Настройка Firebase

#### Создание Firebase проекта

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект
3. Включите Authentication с Google провайдером
4. Получите конфигурацию для веб-приложения

#### Настройка переменных окружения

Отредактируйте `.env` файл:

```bash
# Firebase Admin SDK (Backend)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (Frontend)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Список администраторов (через запятую)
ADMIN_ALLOW_EMAILS=admin@example.com,another@example.com
```

### 3. Сборка и запуск

#### Production режим

```bash
# Сборка всех сервисов
docker-compose --profile prod build

# Запуск в production режиме
docker-compose --profile prod up -d

# Просмотр логов
docker-compose --profile prod logs -f
```

#### Development режим

```bash
# Запуск в development режиме
docker-compose --profile dev up -d

# Просмотр логов
docker-compose --profile dev logs -f
```

### 4. Проверка работы

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Admin Panel:** http://localhost:3000/admin
- **MongoDB:** localhost:27017

## Конфигурация

### Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|---------|
| `FIREBASE_PROJECT_ID` | ID Firebase проекта | `my-project-123` |
| `FIREBASE_CLIENT_EMAIL` | Email сервисного аккаунта | `firebase-adminsdk-xxx@...` |
| `FIREBASE_PRIVATE_KEY` | Приватный ключ Firebase | `-----BEGIN PRIVATE KEY-----...` |
| `ADMIN_ALLOW_EMAILS` | Список админов | `admin@example.com,user@example.com` |
| `MONGO_URI` | Строка подключения к MongoDB | `mongodb://mongodb:27017/jspulse` |

### Профили Docker Compose

#### Production (`--profile prod`)
- Оптимизированные сборки
- Минимальные образы
- Production настройки

#### Development (`--profile dev`)
- Hot reload
- Отладочные инструменты
- Исходный код монтируется

## Административная панель

### Доступ к админке

1. Откройте http://localhost:3000/admin
2. Нажмите "Войти" в хедере
3. Войдите через Google
4. Убедитесь, что ваш email в `ADMIN_ALLOW_EMAILS`

### Функции админки

- **Статистика системы** - количество вакансий, навыков
- **Управление парсерами** - запуск парсеров вручную
- **Управление cron** - планировщик задач
- **Логи парсинга** - мониторинг в реальном времени
- **Управление вакансиями** - удаление вакансий

## Мониторинг

### Логи

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Health checks

```bash
# Проверка состояния сервисов
docker-compose ps

# Проверка health check
curl http://localhost:3001/health
```

### Метрики

- **Backend:** http://localhost:3001/health
- **Frontend:** http://localhost:3000
- **MongoDB:** через mongosh

## Устранение неполадок

### Проблемы с аутентификацией

#### "Missing Authorization header"
- Проверьте, что Firebase токен отправляется
- Убедитесь, что пользователь авторизован

#### "Forbidden"
- Проверьте, что email в `ADMIN_ALLOW_EMAILS`
- Убедитесь, что переменная окружения настроена

### Проблемы с парсерами

#### "Parser script not found"
- Убедитесь, что backend собран
- Проверьте, что скрипты существуют в `backend/dist/scripts/`

### Проблемы с базой данных

#### "MongoServerSelectionError"
- Проверьте, что MongoDB запущен
- Убедитесь, что строка подключения правильная

## Обновление

### Обновление кода

```bash
# Остановка сервисов
docker-compose down

# Обновление кода
git pull

# Пересборка и запуск
docker-compose --profile prod build
docker-compose --profile prod up -d
```

### Обновление данных

```bash
# Создание бэкапа
docker-compose exec mongodb mongodump --out /data/backup

# Восстановление из бэкапа
docker-compose exec mongodb mongorestore /data/backup
```

## Безопасность

### Рекомендации

1. **Используйте HTTPS** в production
2. **Ограничьте доступ** к MongoDB
3. **Регулярно обновляйте** зависимости
4. **Мониторьте логи** на предмет подозрительной активности

### Firewall

```bash
# Открыть только необходимые порты
ufw allow 3000  # Frontend
ufw allow 3001  # Backend (если нужен внешний доступ)
ufw allow 22    # SSH
```

## Производительность

### Оптимизация

1. **Используйте SSD** для MongoDB
2. **Настройте индексы** в MongoDB
3. **Мониторьте использование** ресурсов
4. **Настройте лимиты** памяти для контейнеров

### Масштабирование

```yaml
# docker-compose.override.yml
services:
  backend:
    deploy:
      replicas: 3
  frontend:
    deploy:
      replicas: 2
```

## Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs -f`
2. Проверьте статус: `docker-compose ps`
3. Проверьте конфигурацию: `.env` файл
4. Создайте issue в репозитории

---

*Последнее обновление: 2025-01-08*
