# 🐳 JSPulse Docker Deployment

## Быстрый старт

### 1. Настройка окружения

```bash
# Скопируйте файл с переменными окружения
cp docker.env.example .env

# Отредактируйте .env с вашими настройками Firebase
nano .env
```

### 2. Запуск

```bash
# Простой запуск через скрипт
./start-docker.sh

# Или вручную
docker-compose --profile prod up -d
```

### 3. Доступ к приложению

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001  
- **Admin Panel:** http://localhost:3000/admin

## Конфигурация Firebase

### Backend (.env)
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
ADMIN_ALLOW_EMAILS=admin@example.com,user@example.com
```

### Frontend (.env)
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

## Команды

### Production
```bash
# Запуск
docker-compose --profile prod up -d

# Логи
docker-compose --profile prod logs -f

# Остановка
docker-compose --profile prod down
```

### Development
```bash
# Запуск
docker-compose --profile dev up -d

# Логи
docker-compose --profile dev logs -f

# Остановка
docker-compose --profile dev down
```

### Сборка
```bash
# Сборка всех образов
docker-compose --profile prod build

# Пересборка конкретного сервиса
docker-compose build backend
docker-compose build frontend
```

## Админка

### Доступ
1. Откройте http://localhost:3000/admin
2. Нажмите "Войти" в хедере
3. Войдите через Google
4. Убедитесь, что ваш email в `ADMIN_ALLOW_EMAILS`

### Функции
- 📊 **Статистика** - количество вакансий и навыков
- 🔄 **Парсеры** - запуск парсеров вручную
- ⏰ **Cron** - управление планировщиком
- 📝 **Логи** - мониторинг в реальном времени
- 🗑️ **Вакансии** - удаление вакансий

## Устранение неполадок

### Проблемы с аутентификацией
- Проверьте настройки Firebase в `.env`
- Убедитесь, что email в `ADMIN_ALLOW_EMAILS`

### Проблемы с парсерами
- Убедитесь, что backend собран: `pnpm run build`
- Проверьте логи: `docker-compose logs backend`

### Проблемы с базой данных
- Проверьте, что MongoDB запущен: `docker-compose ps`
- Проверьте логи: `docker-compose logs mongodb`

## Мониторинг

```bash
# Статус сервисов
docker-compose ps

# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Использование ресурсов
docker stats
```

## Обновление

```bash
# Остановка
docker-compose down

# Обновление кода
git pull

# Пересборка и запуск
docker-compose --profile prod build
docker-compose --profile prod up -d
```

---

📚 **Подробная документация:** [docs/docker-deployment.md](docs/docker-deployment.md)
