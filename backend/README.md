# 🔧 JSPulse Backend

**Backend сервер JSPulse** - высокопроизводительный Node.js API для управления вакансиями, построенный на Clean Architecture с использованием TypeScript, Express и MongoDB.

## ✨ Особенности

- 🚀 **Node.js 20** - современная LTS версия
- 🎯 **TypeScript** - строгая типизация для надежности
- 🏗️ **Clean Architecture** - разделение на слои
- 🔄 **Dependency Injection** - IoC контейнер
- 💾 **MongoDB** - NoSQL база данных
- ⚡ **Memory Cache** - встроенное кэширование
- 🔐 **JWT аутентификация** - безопасность API
- 📊 **Telegram парсер** - автоматический сбор вакансий

## 🏗️ Архитектура

### **Слои приложения**
```
src/
├── 📁 routes/              # API маршруты (Presentation Layer)
├── 📁 services/            # Бизнес-логика (Business Layer)
├── 📁 repositories/        # Доступ к данным (Data Access Layer)
├── 📁 models/              # Модели данных (Domain Layer)
├── 📁 middleware/          # Middleware (Infrastructure Layer)
├── 📁 container/           # DI контейнер (Infrastructure Layer)
└── 📁 utils/               # Утилиты (Infrastructure Layer)
```

### **Dependency Injection**
```
src/container/
├── 📄 ContainerFactory.ts  # Фабрика контейнеров
├── 📄 DIContainer.ts       # DI контейнер
└── 📄 serviceRegistrations.ts # Регистрация сервисов
```

### **Сервисы**
```
src/services/
├── 📁 admin/               # Админ сервисы
├── 📁 telegram/            # Telegram интеграция
├── 📄 AdminService.ts      # Управление админ панелью
├── 📄 cache.service.ts     # Кэш сервис
├── 📄 DescriptionService.ts # Обработка описаний
├── 📄 DocumentationService.ts # Документация API
├── 📄 MemoryCacheService.ts # Кэш в памяти
├── 📄 SchedulerService.ts  # Планировщик задач
└── 📄 TelegramParserService.ts # Парсер Telegram
```

## 🚀 Быстрый старт

### **Предварительные требования**
- Node.js 18+
- MongoDB 7+
- pnpm 8+

### **Установка зависимостей**
```bash
pnpm install
```

### **Переменные окружения**
Создайте `.env` файл:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/jspulse

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Telegram (опционально)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE=your_phone

# Cache
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# Logging
LOG_LEVEL=info
DEBUG=false
```

### **Разработка**
```bash
# Запуск dev сервера
pnpm run dev

# Сборка для production
pnpm run build

# Запуск production сервера
pnpm start

# Проверка типов
pnpm run type-check

# Линтинг
pnpm run lint

# Форматирование кода
pnpm run format
```

### **Тестирование**
```bash
# Unit тесты
pnpm test

# Тесты с coverage
pnpm run test:coverage

# Интеграционные тесты
pnpm run test:integration

# E2E тесты
pnpm run test:e2e

# Тесты в watch режиме
pnpm run test:watch
```

## 🗄️ База данных

### **MongoDB модели**
```typescript
// src/models/Vacancy.ts
interface Vacancy {
  _id: ObjectId;
  title: string;
  company: string;
  location: string;
  salaryFrom?: number;
  salaryTo?: number;
  skills: string[];
  description: string;
  source: 'hh' | 'telegram' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}
```

### **Репозитории**
```typescript
// src/repositories/VacancyRepository.ts
interface IVacancyRepository {
  findAll(options: PaginationOptions): Promise<PaginatedResult<Vacancy>>;
  findById(id: string): Promise<Vacancy | null>;
  findBySkills(skills: string[]): Promise<Vacancy[]>;
  create(vacancy: CreateVacancyDTO): Promise<Vacancy>;
  update(id: string, data: UpdateVacancyDTO): Promise<Vacancy | null>;
  delete(id: string): Promise<boolean>;
  getSkillsStats(): Promise<SkillStat[]>;
}
```

### **Миграции и сидинг**
```bash
# Очистка базы данных
pnpm run db:clear

# Заполнение тестовыми данными
pnpm run db:seed

# Импорт с HeadHunter
pnpm run db:hh

# Полное обновление базы
pnpm run db:refresh
```

## 🔌 API Endpoints

### **Вакансии**
```
GET    /api/vacancies              # Список вакансий
GET    /api/vacancies/:id          # Детали вакансии
POST   /api/vacancies              # Создание вакансии
PUT    /api/vacancies/:id          # Обновление вакансии
DELETE /api/vacancies/:id          # Удаление вакансии

GET    /api/vacancies/skills       # Доступные навыки
GET    /api/vacancies/skills/stats # Статистика навыков
```

### **Админ панель**
```
GET    /api/admin/stats            # Статистика системы
GET    /api/admin/vacancies        # Управление вакансиями
POST   /api/admin/vacancies        # Создание вакансии
PUT    /api/admin/vacancies/:id    # Обновление вакансии
DELETE /api/admin/vacancies/:id    # Удаление вакансии

POST   /api/admin/parse/telegram   # Запуск парсинга Telegram
POST   /api/admin/parse/hh         # Запуск парсинга HH
```

### **Планировщик**
```
GET    /api/scheduler/status       # Статус планировщика
POST   /api/scheduler/start        # Запуск планировщика
POST   /api/scheduler/stop         # Остановка планировщика
POST   /api/scheduler/parse        # Ручной запуск парсинга
```

## 🔐 Аутентификация и авторизация

### **JWT токены**
```typescript
// Middleware для проверки JWT
app.use('/api/admin', authGuard, adminRoutes);
app.use('/api/scheduler', authGuard, schedulerRoutes);
```

### **Роли пользователей**
- **User** - просмотр вакансий
- **Admin** - полный доступ к системе
- **Scheduler** - управление планировщиком

## ⚡ Кэширование

### **Memory Cache Service**
```typescript
// src/services/MemoryCacheService.ts
interface ICacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}
```

### **Стратегии кэширования**
- **TTL (Time To Live)** - автоматическое истечение
- **LRU (Least Recently Used)** - вытеснение старых записей
- **Size-based** - ограничение по размеру кэша

## 📡 Telegram интеграция

### **Парсер сообщений**
```typescript
// src/services/telegram/MessageProcessor.ts
class MessageProcessor {
  async processMessage(message: TelegramMessage): Promise<Vacancy | null>;
  extractVacancyData(text: string): Partial<Vacancy>;
  validateVacancyData(data: Partial<Vacancy>): boolean;
}
```

### **Управление сессиями**
```typescript
// src/services/telegram/SessionManager.ts
class SessionManager {
  async createSession(): Promise<string>;
  async validateSession(sessionId: string): Promise<boolean>;
  async destroySession(sessionId: string): Promise<void>;
}
```

## 🕐 Планировщик задач

### **Cron-подобные задачи**
```typescript
// src/services/SchedulerService.ts
class SchedulerService {
  scheduleTelegramParsing(cronExpression: string): void;
  scheduleHHParsing(cronExpression: string): void;
  scheduleCacheCleanup(cronExpression: string): void;
}
```

### **Настройка расписания**
```bash
# Парсинг Telegram каждые 2 часа
0 */2 * * * *  # Telegram parsing

# Парсинг HH каждые 6 часов  
0 */6 * * * *  # HH parsing

# Очистка кэша каждый день в 3:00
0 0 3 * * *    # Cache cleanup
```

## 🧪 Тестирование

### **Unit тесты (Jest)**
```typescript
// tests/unit/services/MemoryCacheService.test.ts
import { MemoryCacheService } from '../../../src/services/MemoryCacheService';

describe('MemoryCacheService', () => {
  let cacheService: MemoryCacheService;

  beforeEach(() => {
    cacheService = new MemoryCacheService();
  });

  it('should store and retrieve values', () => {
    cacheService.set('key', 'value');
    expect(cacheService.get('key')).toBe('value');
  });
});
```

### **Интеграционные тесты**
```typescript
// tests/integration/routes/vacancyRoutes.test.ts
import request from 'supertest';
import { app } from '../../../src/app';

describe('Vacancy Routes', () => {
  it('should return paginated vacancies', async () => {
    const response = await request(app)
      .get('/api/vacancies?page=0&limit=10')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('items');
    expect(response.body.data).toHaveProperty('pagination');
  });
});
```

### **Тестовые данные**
```typescript
// tests/fixtures/mockVacancies.ts
export const mockVacancies = [
  {
    title: 'Frontend Developer',
    company: 'Tech Corp',
    skills: ['React', 'TypeScript', 'Tailwind'],
    // ... другие поля
  }
];
```

## 📊 Мониторинг и логирование

### **Уровни логирования**
```typescript
import { logger } from '../middleware/logger';

logger.debug('Debug info', { context: data });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error occurred', error);
```

### **Метрики производительности**
- **Response time** - время ответа API
- **Throughput** - количество запросов в секунду
- **Error rate** - процент ошибок
- **Cache hit rate** - эффективность кэша

## 🐳 Docker

### **Dockerfile**
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3001
CMD ["npm", "start"]
```

### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/jspulse
    depends_on:
      - mongo
```

## 🔧 Конфигурация

### **TypeScript**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### **ESLint**
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn'
  }
};
```

## 🚀 Развертывание

### **Production**
```bash
# Сборка
pnpm run build

# Запуск
NODE_ENV=production pnpm start
```

### **PM2**
```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'jspulse-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

## 📚 Документация API

### **Swagger/OpenAPI**
```typescript
// Автоматическая генерация документации
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

### **API схемы**
```typescript
// src/schemas/vacancy.schema.ts
export const createVacancySchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  skills: z.array(z.string()),
  // ... другие поля
});
```

## 🤝 Вклад в разработку

### **Стиль кода**
- Следуйте Clean Architecture принципам
- Используйте TypeScript для всех файлов
- Добавляйте JSDoc комментарии
- Следуйте SOLID принципам

### **Тестирование**
- Покрывайте код unit тестами
- Добавляйте integration тесты
- Используйте моки для внешних зависимостей
- Поддерживайте высокий coverage

### **Документация**
- Обновляйте API документацию
- Документируйте архитектурные решения
- Добавляйте примеры использования
- Поддерживайте актуальность README

---

**JSPulse Backend - высокопроизводительный API для управления IT вакансиями с Clean Architecture!** 🚀✨
