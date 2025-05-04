# HTTP-адаптер для JS Pulse

HTTP-адаптер предоставляет унифицированный интерфейс для работы с HTTP-запросами как на бэкенде, так и на фронтенде.

## Основные возможности

- Единый интерфейс для HTTP-клиентов
- Поддержка разных реализаций (Fetch API, Ky)
- Декораторы для добавления функциональности (логирование, кэширование и т.д.)
- Адаптеры для работы с внешними API (HeadHunter и др.)
- Поддержка работы как в браузере, так и на сервере (node.js)

## Использование

### Базовое использование

```typescript
import { httpClient } from '@/utils/http';

// GET-запрос
const users = await httpClient.get<User[]>('api/users');

// POST-запрос
const result = await httpClient.post<CreateUserResponse>('api/users', {
  name: 'Иван',
  email: 'ivan@example.com'
});

// Запросы с параметрами
const filteredUsers = await httpClient.get<User[]>('api/users', {
  params: {
    role: 'admin',
    active: 'true'
  }
});
```

### Создание настраиваемого клиента

```typescript
import { createHttpClient } from '@/utils/http';

// Создаем клиент с базовым URL и логированием
const apiClient = createHttpClient({
  baseUrl: 'https://api.example.com/v2',
  logging: true,
  defaultHeaders: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

// Используем клиент
const data = await apiClient.get<ApiResponse>('resource');
```

### Использование с кэшированием

```typescript
import { createHttpClient } from '@/utils/http';

// Создаем клиент с кэшированием
const cachedClient = createHttpClient({
  baseUrl: 'https://api.example.com',
  caching: {
    ttl: 5 * 60 * 1000, // 5 минут
    maxSize: 100
  }
});

// Первый запрос выполнится по сети
const data1 = await cachedClient.get<ApiResponse>('resource');

// Второй запрос возьмется из кэша (при тех же параметрах)
const data2 = await cachedClient.get<ApiResponse>('resource');
```

### Работа с внешними API (HeadHunter)

```typescript
import { HeadHunterClient } from '@/utils/http';

// Создаем клиент для работы с HeadHunter API
const hhClient = new HeadHunterClient({
  logging: true
});

// Поиск вакансий
const searchResult = await hhClient.searchVacancies({
  text: 'JavaScript developer',
  area: 1, // Москва
  per_page: 10
});

// Получение детальной информации о вакансии
const vacancy = await hhClient.getVacancy('12345678');
```

## Архитектура

Адаптер использует паттерны проектирования:

1. **Adapter Pattern** — для унификации интерфейса HTTP-клиентов
2. **Decorator Pattern** — для добавления функциональности (логирование, кэширование)
3. **Factory Method** — для создания клиентов с разными настройками

## Файловая структура

- `HttpClient.ts` — интерфейс HTTP-клиента
- `KyHttpClient.ts` — реализация на основе библиотеки Ky
- `LoggingHttpClient.ts` — декоратор для логирования запросов
- `CachingHttpClient.ts` — декоратор для кэширования запросов
- `httpClientFactory.ts` — фабрика для создания клиентов
- `adapters/` — адаптеры для работы с внешними API
  - `HeadHunterClient.ts` — адаптер для HeadHunter API

## Расширение

Для добавления новой функциональности:

1. Создать новый декоратор, реализующий интерфейс `HttpClient`
2. Обновить фабрику для поддержки новой функциональности
3. Добавить экспорт в `index.ts`