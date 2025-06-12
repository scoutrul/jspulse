# Архитектурное правило: Запрет Magic Numbers в JSPulse

**Дата создания:** Январь 2025  
**Статус:** Активное правило архитектуры  
**Приоритет:** Критический  

## Определение Magic Numbers

**Magic Number** - это числовое или строковое литеральное значение, используемое в коде без объяснения его смысла или назначения. Такие значения делают код менее читаемым, поддерживаемым и подверженным ошибкам.

### Примеры Magic Numbers:

❌ **Плохо:**
```typescript
// Что означает 10? Почему именно 10?
export let pageSize: number = 10;

// Что это за 1200? Откуда взялось?
setTimeout(() => animate(), 1200);

// Почему 50vh? Можно ли изменить?
padding-bottom: 50vh;

// Что означает 'ru'? Есть ли альтернативы?
count.toLocaleString('ru');
```

✅ **Хорошо:**
```typescript
// Ясно, откуда взялось значение и что означает
export let pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE;

// Понятно назначение и можно легко изменить
setTimeout(() => animate(), ANIMATION.FADE_IN_DURATION_MS);

// Конфигурируемое UX значение
padding-bottom: var(--bottom-padding, ${UX.BOTTOM_PADDING});

// Централизованная локализация
count.toLocaleString(LOCALE.PRIMARY);
```

## Архитектурное правило

### 🚫 ЗАПРЕЩЕНО использовать:

1. **Числовые литералы** в бизнес-логике
2. **Строковые литералы** для конфигурации
3. **Повторяющиеся значения** без константы
4. **Недокументированные ограничения**

### ✅ ОБЯЗАТЕЛЬНО использовать:

1. **Именованные константы** для всех статических значений
2. **Группировку констант** по функциональности
3. **Типизацию констант** в TypeScript
4. **Документирование** назначения каждой константы

## Структура констант в JSPulse

### 1. Shared константы (`shared/src/constants/`)
```typescript
// Общие константы для frontend и backend
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,           // Размер страницы по умолчанию
  MAX_PAGE_SIZE: 500,              // Максимальный размер для защиты
  AVAILABLE_PAGE_SIZES: [10, 20, 50, 100] as const
} as const;

export const API = {
  ENDPOINTS: {
    VACANCIES: '/api/vacancies',   // Базовый endpoint вакансий
    SKILLS: '/api/skills'          // Endpoint для навыков
  }
} as const;
```

### 2. Frontend константы (`frontend/src/lib/config/`)
```typescript
// UI и анимация
export const ANIMATION = {
  FADE_IN_DURATION_MS: 1200,      // Длительность fade-in анимации
  TIMING: {
    DOM_RENDER_DELAY: 50,         // Задержка для DOM рендера
    SCROLL_DELAY: 100             // Задержка перед скроллом
  }
} as const;

export const UX = {
  BOTTOM_PADDING: '50vh',         // Отступ для комфортного скролла
  LOAD_MORE_BUTTON_MIN_WIDTH: {
    DESKTOP: '160px',             // Минимальная ширина кнопки
    MOBILE: '140px'
  }
} as const;
```

### 3. Backend константы (`backend/src/config/`)
```typescript
// Серверные настройки
export const CACHE = {
  SEARCH_RESULTS_TTL: 300,        // TTL кэша поиска (5 минут)
  SKILLS_TTL: 3600                // TTL кэша навыков (1 час)
} as const;

export const PERFORMANCE = {
  MAX_QUERY_TIME: 10000,          // Максимальное время запроса
  DB_TIMEOUT: 5000                // Таймаут подключения к БД
} as const;
```

## Правила именования констант

### 1. Группировка по функциональности
```typescript
// ✅ Логическое группирование
export const PAGINATION = { ... };
export const ANIMATION = { ... };
export const CACHE = { ... };

// ❌ Плоская структура
export const DEFAULT_PAGE_SIZE = 10;
export const FADE_DURATION = 1200;
export const CACHE_TTL = 300;
```

### 2. Описательные имена
```typescript
// ✅ Понятные имена
FADE_IN_DURATION_MS: 1200
DOM_RENDER_DELAY: 50
LOAD_MORE_BUTTON_MIN_WIDTH: '160px'

// ❌ Неясные имена
DURATION: 1200
DELAY: 50
MIN_WIDTH: '160px'
```

### 3. Единицы измерения в названиях
```typescript
// ✅ Единицы в названии
TIMEOUT_MS: 5000                // миллисекунды
CACHE_TTL_SEC: 300             // секунды
PADDING_VH: '50vh'             // viewport height

// ❌ Неясные единицы
TIMEOUT: 5000                  // что это? мс? сек?
CACHE_TTL: 300
PADDING: '50vh'
```

## Процесс внедрения

### 1. Code Review требования
- ❌ **Блокировать PR** с magic numbers
- ✅ **Требовать константы** для всех статических значений
- 📝 **Документировать** назначение новых констант

### 2. Линтер правила
```typescript
// ESLint правило против magic numbers
"@typescript-eslint/no-magic-numbers": [
  "error", 
  { 
    "ignore": [-1, 0, 1], // Разрешены только базовые значения
    "ignoreArrayIndexes": true,
    "ignoreDefaultValues": false
  }
]
```

### 3. Рефакторинг существующего кода
- 🔍 **Поиск** magic numbers в кодовой базе
- 🔄 **Замена** на именованные константы
- 📚 **Документирование** новых констант
- ✅ **Проверка** консистентности

## Исключения из правила

### Допустимые magic numbers:
```typescript
// ✅ Математические константы
Math.PI, Math.E

// ✅ Базовые числовые операции
array.length - 1
index + 1
value * 2

// ✅ HTTP статус коды (стандартные)
response.status === 200
response.status === 404

// ✅ Очевидные индексы массивов
items[0], items[1]
```

### Требуют константы:
```typescript
// ❌ Бизнес-логика
if (pageSize > 100) // -> PAGINATION.MAX_PAGE_SIZE

// ❌ UI размеры
width: '160px' // -> UX.BUTTON_MIN_WIDTH

// ❌ Времена ожидания
setTimeout(fn, 5000) // -> TIMEOUT.DEFAULT_MS

// ❌ Конфигурационные строки
locale: 'ru' // -> LOCALE.PRIMARY
```

## Преимущества внедрения

### 🎯 Читаемость кода
- Код самодокументируется
- Ясное назначение каждого значения
- Легче понимать бизнес-логику

### 🔧 Поддерживаемость
- Изменения в одном месте
- Исключены ошибки рассинхронизации
- Простое A/B тестирование значений

### 🚀 Масштабируемость
- Легко добавлять новые конфигурации
- Централизованное управление настройками
- Возможность runtime конфигурации

### 🛡️ Безопасность
- Валидация значений в одном месте
- Предотвращение некорректных значений
- Контролируемые границы параметров

## Заключение

Правило **"Нет Magic Numbers"** является фундаментальным принципом архитектуры JSPulse. Оно обеспечивает:

- **Читаемый** и самодокументированный код
- **Поддерживаемую** и масштабируемую архитектуру  
- **Безопасную** и контролируемую конфигурацию
- **Эффективную** разработку и отладку

Все разработчики проекта **обязаны** следовать этому правилу и активно участвовать в устранении magic numbers из существующего кода.

---

*Документ создан по результатам успешного рефакторинга системы пагинации JSPulse в январе 2025.* 