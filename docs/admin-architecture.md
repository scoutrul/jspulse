# JSPulse Admin Architecture

## Архитектурная диаграмма

```mermaid
graph TB
    subgraph "Frontend (SvelteKit)"
        A[Admin Page] --> B[SystemStats]
        A --> C[ParsingActions]
        A --> D[CronControls]
        A --> E[Login Component]
        A --> F[ToastNotifications]
        A --> G[ConfirmDialog]
        
        B --> H[StatCard]
        C --> I[ActionButton]
        C --> J[ParsingLogs]
        
        K[AuthStore] --> A
        L[HTTP Client] --> M[API Client]
    end
    
    subgraph "Backend (Express.js)"
        N[Admin Routes] --> O[Firebase Auth Middleware]
        N --> P[Require Admin Middleware]
        
        N --> Q[Stats Controller]
        N --> R[Parsing Controller]
        N --> S[Cron Controller]
        N --> T[Vacancy Controller]
        
        Q --> U[GetSystemStats UseCase]
        R --> V[Parsing Scripts]
        S --> W[Cron Runner]
        T --> X[DeleteVacancy UseCase]
    end
    
    subgraph "External Services"
        Y[Firebase Auth] --> O
        Z[MongoDB] --> U
        Z --> X
        AA[Parsing Sources] --> V
        BB[Telegram API] --> V
        CC[HeadHunter API] --> V
        DD[Habr API] --> V
        EE[Careered API] --> V
    end
    
    subgraph "Authentication Flow"
        FF[Google OAuth] --> Y
        Y --> GG[ID Token]
        GG --> O
        O --> HH[Verify Token]
        HH --> II[Check Email Allowlist]
        II --> P
    end
    
    M --> N
    K --> Y
    V --> J
    W --> J
```

## Компоненты системы

### Frontend Components

#### Основные страницы
- **Admin Page** (`/admin`) - главная страница админки
- **Login Component** - аутентификация через Google

#### UI компоненты
- **SystemStats** - отображение статистики системы
- **ParsingActions** - управление парсерами
- **CronControls** - управление планировщиком
- **ToastNotifications** - уведомления
- **ConfirmDialog** - диалоги подтверждения

#### Вспомогательные компоненты
- **StatCard** - карточка статистики
- **ActionButton** - кнопка действия
- **ParsingLogs** - логи парсинга

### Backend Components

#### Middleware
- **Firebase Auth Middleware** - проверка Firebase токена
- **Require Admin Middleware** - проверка прав администратора

#### Controllers
- **Stats Controller** - управление статистикой
- **Parsing Controller** - управление парсерами
- **Cron Controller** - управление планировщиком
- **Vacancy Controller** - управление вакансиями

#### Use Cases
- **GetSystemStats** - получение статистики
- **DeleteVacancy** - удаление вакансии
- **ClearCache** - очистка кэша

### External Services

#### Аутентификация
- **Firebase Auth** - аутентификация пользователей
- **Google OAuth** - провайдер входа

#### База данных
- **MongoDB** - хранение данных

#### Источники парсинга
- **HeadHunter API** - вакансии с hh.ru
- **Habr API** - вакансии с Habr Career
- **Telegram API** - вакансии из Telegram
- **Careered API** - вакансии через Careered

## Поток данных

### 1. Аутентификация
```
User → Google OAuth → Firebase Auth → ID Token → Backend → Verify → Allowlist Check → Access
```

### 2. Получение статистики
```
Admin Page → HTTP Client → API Client → Admin Routes → Stats Controller → GetSystemStats → MongoDB → Response
```

### 3. Запуск парсера
```
ParsingActions → HTTP Client → Admin Routes → Parsing Controller → Spawn Script → External API → MongoDB → Logs
```

### 4. Управление cron
```
CronControls → HTTP Client → Admin Routes → Cron Controller → Cron Runner → Scheduled Tasks
```

## Безопасность

### Аутентификация
1. **Google OAuth** - вход через Google
2. **Firebase ID Token** - JWT токен для API
3. **Token Verification** - проверка токена на сервере

### Авторизация
1. **Email Allowlist** - список разрешенных email
2. **Middleware Chain** - последовательная проверка прав
3. **Route Protection** - защита всех admin routes

### Защита данных
1. **HTTPS** - шифрование трафика
2. **CORS** - ограничение доменов
3. **Input Validation** - валидация входных данных

## Масштабирование

### Горизонтальное масштабирование
- **Load Balancer** - распределение нагрузки
- **Multiple Backend Instances** - несколько экземпляров бэкенда
- **Shared MongoDB** - общая база данных

### Вертикальное масштабирование
- **More CPU/RAM** - увеличение ресурсов
- **MongoDB Optimization** - оптимизация запросов
- **Caching** - кэширование данных

## Мониторинг

### Логи
- **Application Logs** - логи приложения
- **Parsing Logs** - логи парсинга
- **Error Logs** - логи ошибок

### Метрики
- **System Stats** - статистика системы
- **Performance Metrics** - метрики производительности
- **Health Checks** - проверки здоровья

### Алерты
- **Error Notifications** - уведомления об ошибках
- **Performance Alerts** - алерты производительности
- **Security Alerts** - алерты безопасности

## Развертывание

### Development
```bash
# Frontend
cd frontend && pnpm run dev

# Backend
cd backend && pnpm run dev

# MongoDB
docker-compose up mongodb
```

### Production
```bash
# Build
pnpm run build

# Deploy
docker-compose up -d

# Monitor
docker-compose logs -f
```

## Конфигурация

### Environment Variables
- **Firebase** - настройки аутентификации
- **MongoDB** - строка подключения
- **Admin Emails** - список администраторов
- **API Keys** - ключи внешних сервисов

### Feature Flags
- **Enable Parsing** - включение парсинга
- **Enable Cron** - включение планировщика
- **Debug Mode** - режим отладки

---

*Эта диаграмма показывает архитектуру админки JSPulse и взаимосвязи между компонентами.*
