# 📦 JSPulse Shared

**Shared пакет JSPulse** - общая библиотека типов, интерфейсов и схем для frontend и backend, обеспечивающая типобезопасность и консистентность данных между слоями приложения.

## ✨ Особенности

- 🎯 **TypeScript** - строгая типизация для всех модулей
- 🔄 **Общие типы** - единые интерфейсы для frontend и backend
- ✅ **Zod схемы** - валидация данных на всех уровнях
- 🏗️ **Архитектурные паттерны** - интерфейсы для Clean Architecture
- 📊 **DTO объекты** - Data Transfer Objects для API
- 🗄️ **Модели БД** - типы для MongoDB
- 🎨 **UI константы** - общие настройки интерфейса

## 🏗️ Архитектура

### **Структура пакета**
```
src/
├── 📁 constants/           # Константы приложения
├── 📁 events/              # События и типы событий
├── 📁 schemas/             # Zod схемы валидации
└── 📁 types/               # TypeScript типы и интерфейсы
    ├── 📁 core/            # Базовые типы и интерфейсы
    ├── 📁 db/              # Типы базы данных
    ├── 📁 dto/             # Data Transfer Objects
    ├── 📁 sources/         # Типы внешних источников
    └── 📄 vacancy.types.ts # Основные типы вакансий
```

### **Слои типизации**
```
types/
├── 📁 core/                # Domain Layer
│   ├── 📄 cache.interface.ts      # Интерфейс кэша
│   ├── 📄 di-container.interface.ts # DI контейнер
│   ├── 📄 repository.interface.ts # Базовый репозиторий
│   ├── 📄 vacancy-repository.interface.ts # Репозиторий вакансий
│   └── 📄 vacancy.base.ts         # Базовые типы вакансий
├── 📁 db/                  # Data Access Layer
│   └── 📄 vacancy.model.ts        # Модель MongoDB
├── 📁 dto/                 # Presentation Layer
│   ├── 📄 api.dto.ts              # API ответы
│   └── 📄 vacancy.dto.ts          # DTO вакансий
└── 📁 sources/             # External Layer
    ├── 📄 hh.types.ts             # HeadHunter API
    └── 📄 telegram.types.ts       # Telegram API
```

## 🎯 Основные типы

### **Вакансии**
```typescript
// src/types/vacancy.types.ts
export interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryFrom?: number | null;
  salaryTo?: number | null;
  skills: string[];
  description: string;
  source: VacancySource;
  createdAt: Date;
  updatedAt: Date;
}

export type VacancySource = 'hh' | 'telegram' | 'manual';
export type VacancyStatus = 'active' | 'closed' | 'draft';
```

### **API ответы**
```typescript
// src/types/dto/api.dto.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
  total: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### **Фильтры и поиск**
```typescript
// src/types/dto/vacancy.dto.ts
export interface VacancyFilters {
  skills?: string[];
  location?: string;
  company?: string;
  salaryFrom?: number;
  salaryTo?: number;
  source?: VacancySource;
  status?: VacancyStatus;
}

export interface SearchOptions {
  query: string;
  filters?: VacancyFilters;
  sortBy?: 'relevance' | 'date' | 'salary';
  sortOrder?: 'asc' | 'desc';
}
```

## 🔄 Интерфейсы

### **Repository Pattern**
```typescript
// src/types/core/repository.interface.ts
export interface IRepository<T> {
  findAll(options?: PaginationOptions): Promise<PaginatedResult<T>>;
  findById(id: string): Promise<T | null>;
  create(data: CreateDTO<T>): Promise<T>;
  update(id: string, data: UpdateDTO<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

export interface IVacancyRepository extends IRepository<Vacancy> {
  findBySkills(skills: string[]): Promise<Vacancy[]>;
  findByCompany(company: string): Promise<Vacancy[]>;
  findByLocation(location: string): Promise<Vacancy[]>;
  getSkillsStats(): Promise<SkillStat[]>;
  search(query: string, options?: SearchOptions): Promise<Vacancy[]>;
}
```

### **Dependency Injection**
```typescript
// src/types/core/di-container.interface.ts
export interface IDIContainer {
  register<T>(token: string, implementation: T): void;
  resolve<T>(token: string): T;
  has(token: string): boolean;
  clear(): void;
}

export interface IServiceFactory<T> {
  create(): T;
  destroy(instance: T): void;
}
```

### **Кэширование**
```typescript
// src/types/core/cache.interface.ts
export interface ICacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
  keys(): string[];
  size(): number;
}

export interface CacheOptions {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'ttl' | 'hybrid';
}
```

## ✅ Zod схемы

### **Валидация вакансий**
```typescript
// src/schemas/vacancy.schema.ts
import { z } from 'zod';

export const createVacancySchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  company: z.string().min(1, 'Компания обязательна'),
  location: z.string().min(1, 'Локация обязательна'),
  salaryFrom: z.number().min(0).optional(),
  salaryTo: z.number().min(0).optional(),
  skills: z.array(z.string()).min(1, 'Хотя бы один навык'),
  description: z.string().min(10, 'Описание минимум 10 символов'),
  source: z.enum(['hh', 'telegram', 'manual']),
});

export const updateVacancySchema = createVacancySchema.partial();

export const vacancyFiltersSchema = z.object({
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  company: z.string().optional(),
  salaryFrom: z.number().min(0).optional(),
  salaryTo: z.number().min(0).optional(),
  source: z.enum(['hh', 'telegram', 'manual']).optional(),
});
```

### **Валидация API**
```typescript
// src/schemas/api.schema.ts
export const paginationSchema = z.object({
  page: z.coerce.number().min(0).default(0),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Поисковый запрос обязателен'),
  filters: vacancyFiltersSchema.optional(),
  sortBy: z.enum(['relevance', 'date', 'salary']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### **Валидация дат**
```typescript
// src/schemas/date.schema.ts
export const dateSchema = z.union([
  z.string().datetime(),
  z.date(),
  z.number().int().positive(),
]);

export const dateRangeSchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});
```

## 📊 Константы

### **Пагинация**
```typescript
// src/constants/pagination.constants.ts
export const PAGINATION_CONSTANTS = {
  PROGRESSIVE_STEPS: [10, 20, 30, 50] as const,
  THRESHOLDS: {
    OFFSET_MODE_LIMIT: 100,
    SHOW_ALL_MAX_TOTAL: 50,
    OFFSET_WINDOW_SIZE: 50,
    VIRTUAL_WINDOW_SIZE: 100
  },
  DEFAULT_PAGE: 0,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const PAGINATION_LABELS = {
  SHOW_ALL: 'Показать все',
  LOAD_MORE: 'Загрузить еще',
  NO_MORE: 'Больше нет',
  LOADING: 'Загрузка...',
} as const;
```

### **API константы**
```typescript
// src/constants/api.constants.ts
export const API_CONSTANTS = {
  ENDPOINTS: {
    VACANCIES: '/api/vacancies',
    SKILLS: '/api/vacancies/skills',
    ADMIN: '/api/admin',
    SCHEDULER: '/api/scheduler',
  },
  METHODS: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
  },
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
} as const;
```

## 🎨 UI константы

### **Темы**
```typescript
// src/constants/theme.constants.ts
export const THEME_CONSTANTS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const COLOR_SCHEMES = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#6B7280',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
} as const;
```

### **Breakpoints**
```typescript
// src/constants/breakpoints.constants.ts
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
  DESKTOP: 1280,
  WIDE: 1536,
} as const;

export const MEDIA_QUERIES = {
  MOBILE: `@media (max-width: ${BREAKPOINTS.MOBILE - 1}px)`,
  TABLET: `@media (min-width: ${BREAKPOINTS.MOBILE}px) and (max-width: ${BREAKPOINTS.TABLET - 1}px)`,
  DESKTOP: `@media (min-width: ${BREAKPOINTS.TABLET}px)`,
} as const;
```

## 📡 События

### **Типы событий**
```typescript
// src/events/vacancy.events.ts
export interface VacancyEvent {
  type: VacancyEventType;
  payload: VacancyEventPayload;
  timestamp: Date;
  userId?: string;
}

export type VacancyEventType = 
  | 'vacancy.created'
  | 'vacancy.updated'
  | 'vacancy.deleted'
  | 'vacancy.viewed'
  | 'vacancy.applied';

export interface VacancyEventPayload {
  vacancyId: string;
  vacancyTitle: string;
  company: string;
  skills: string[];
  metadata?: Record<string, unknown>;
}
```

### **Event Bus**
```typescript
// src/events/event-bus.interface.ts
export interface IEventBus {
  emit<T>(event: string, payload: T): void;
  on<T>(event: string, handler: (payload: T) => void): void;
  off(event: string, handler: Function): void;
  once<T>(event: string, handler: (payload: T) => void): void;
}
```

## 🚀 Использование

### **Импорт типов**
```typescript
// В backend или frontend
import type { 
  Vacancy, 
  VacancyFilters, 
  ApiResponse,
  IVacancyRepository 
} from '@jspulse/shared';

import { 
  createVacancySchema, 
  PAGINATION_CONSTANTS 
} from '@jspulse/shared';
```

### **Валидация данных**
```typescript
import { createVacancySchema } from '@jspulse/shared';

// Валидация входящих данных
const validatedData = createVacancySchema.parse(requestBody);

// Безопасная валидация
const result = createVacancySchema.safeParse(requestBody);
if (result.success) {
  const vacancy = result.data;
  // Обработка валидных данных
} else {
  const errors = result.error.errors;
  // Обработка ошибок валидации
}
```

### **Использование констант**
```typescript
import { PAGINATION_CONSTANTS, API_CONSTANTS } from '@jspulse/shared';

// В компонентах
const pageSize = PAGINATION_CONSTANTS.DEFAULT_LIMIT;
const apiUrl = `${API_CONSTANTS.ENDPOINTS.VACANCIES}?page=${page}&limit=${pageSize}`;
```

## 🔧 Сборка

### **TypeScript конфигурация**
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### **Сборка пакета**
```bash
# Установка зависимостей
pnpm install

# Сборка
pnpm run build

# Проверка типов
pnpm run type-check

# Линтинг
pnpm run lint

# Форматирование
pnpm run format
```

### **Скрипты сборки**
```json
// package.json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src"
  }
}
```

## 🧪 Тестирование

### **Unit тесты**
```typescript
// tests/schemas/vacancy.schema.test.ts
import { describe, it, expect } from 'vitest';
import { createVacancySchema } from '../../src/schemas/vacancy.schema';

describe('createVacancySchema', () => {
  it('should validate correct vacancy data', () => {
    const validData = {
      title: 'Frontend Developer',
      company: 'Tech Corp',
      location: 'Moscow',
      skills: ['React', 'TypeScript'],
      description: 'We are looking for a skilled frontend developer',
      source: 'manual' as const,
    };

    const result = createVacancySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid data', () => {
    const invalidData = {
      title: '',
      company: '',
      skills: [],
      description: 'Short',
      source: 'invalid' as any,
    };

    const result = createVacancySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
```

## 📚 Документация

### **JSDoc комментарии**
```typescript
/**
 * Интерфейс для работы с вакансиями
 * @template T - тип вакансии
 */
export interface IVacancyRepository<T extends Vacancy = Vacancy> {
  /**
   * Поиск вакансий по навыкам
   * @param skills - массив навыков для поиска
   * @param options - опции пагинации и фильтрации
   * @returns Promise с найденными вакансиями
   */
  findBySkills(
    skills: string[], 
    options?: SearchOptions
  ): Promise<T[]>;
}
```

### **Примеры использования**
```typescript
// Пример создания вакансии
const newVacancy: CreateVacancyDTO = {
  title: 'Senior Frontend Developer',
  company: 'Tech Company',
  location: 'Remote',
  skills: ['React', 'TypeScript', 'Node.js'],
  description: 'We need an experienced developer...',
  source: 'manual',
};

// Валидация данных
const validatedVacancy = createVacancySchema.parse(newVacancy);

// Использование в репозитории
const createdVacancy = await vacancyRepository.create(validatedVacancy);
```

## 🤝 Вклад в разработку

### **Добавление новых типов**
1. Создайте файл в соответствующей директории `src/types/`
2. Добавьте JSDoc комментарии для документации
3. Создайте Zod схему для валидации
4. Добавьте unit тесты
5. Обновите `src/index.ts` для экспорта

### **Обновление существующих типов**
1. Не изменяйте существующие интерфейсы без необходимости
2. Используйте union types для расширения
3. Добавляйте новые поля как optional
4. Обновляйте соответствующие схемы валидации

### **Стиль кода**
- Используйте PascalCase для интерфейсов и типов
- Используйте camelCase для свойств
- Добавляйте JSDoc комментарии для сложных типов
- Следуйте принципам TypeScript best practices

---

**JSPulse Shared - единый источник истины для типов и схем, обеспечивающий типобезопасность и консистентность данных!** 🎯✨
