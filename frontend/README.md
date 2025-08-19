# 🎨 JSPulse Frontend

**Frontend приложение JSPulse** - современный веб-интерфейс для поиска и анализа IT вакансий, построенный на SvelteKit с использованием TypeScript и Tailwind CSS.

## ✨ Особенности

- 🚀 **SvelteKit 5** - современный full-stack фреймворк
- 🎯 **TypeScript** - строгая типизация для надежности
- 🎨 **Tailwind CSS** - утилитарный CSS фреймворк
- 📱 **Адаптивный дизайн** - работает на всех устройствах
- 🌙 **Темная/светлая тема** - переключение на лету
- ⚡ **Hot Module Replacement** - мгновенное обновление при разработке
- 🔄 **Прогрессивная пагинация** - умная загрузка данных

## 🏗️ Архитектура

### **Структура компонентов**
```
src/lib/components/
├── 📁 about/              # Страница "О проекте"
├── 📁 admin/              # Админ панель
├── 📁 Description/        # Компоненты описания вакансий
├── 📁 ui/                 # Базовые UI компоненты
├── 📁 VacancyCard/        # Карточки вакансий
├── 📄 Filters.svelte      # Система фильтрации
├── 📄 Header.svelte       # Заголовок приложения
├── 📄 TagBubblesCanvas.svelte # Интерактивные пузыри навыков
└── 📄 VacancyList.svelte  # Список вакансий
```

### **Store управление**
```
src/lib/stores/
├── 📄 notificationStore.ts    # Уведомления
├── 📄 parsingLogsStore.ts     # Логи парсинга
├── 📄 scrollStore.ts          # Состояние скролла
├── 📄 selectedSkillsStore.ts  # Выбранные навыки
├── 📄 themeStore.ts           # Тема приложения
└── 📄 vacancyStore.ts         # Состояние вакансий
```

### **API интеграция**
```
src/lib/api/
├── 📄 http.client.ts      # HTTP клиент для браузера
├── 📄 http.server.ts      # HTTP клиент для SSR
└── 📄 vacancy.api.ts      # API для работы с вакансиями
```

## 🚀 Быстрый старт

### **Установка зависимостей**
```bash
pnpm install
```

### **Разработка**
```bash
# Запуск dev сервера
pnpm run dev

# Сборка для production
pnpm run build

# Предварительный просмотр сборки
pnpm run preview

# Проверка типов
pnpm run check

# Линтинг
pnpm run lint

# Форматирование кода
pnpm run format
```

### **Тестирование**
```bash
# Unit тесты
pnpm run test

# E2E тесты
pnpm run test:e2e

# Тесты с coverage
pnpm run test:coverage
```

## 🎨 Дизайн система

### **Цветовая палитра**
- **Primary**: Синий (#3B82F6)
- **Secondary**: Серый (#6B7280)
- **Success**: Зеленый (#10B981)
- **Warning**: Желтый (#F59E0B)
- **Error**: Красный (#EF4444)

### **Типографика**
- **Заголовки**: Inter, sans-serif
- **Основной текст**: Inter, sans-serif
- **Моноширинный**: JetBrains Mono

### **Компоненты**
- **Кнопки**: Градиентные с hover эффектами
- **Карточки**: С тенью и скругленными углами
- **Инпуты**: С фокусом и валидацией
- **Модалы**: С backdrop blur эффектом

## 🔧 Конфигурация

### **Vite**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 3000,
    host: true
  }
});
```

### **Tailwind CSS**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280'
      }
    }
  }
};
```

### **TypeScript**
```json
// tsconfig.json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## 📱 Адаптивность

### **Breakpoints**
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### **Компоненты**
- **Header**: Адаптивное меню с hamburger
- **Filters**: Вертикальное расположение на мобильных
- **VacancyCard**: Карточки с адаптивным контентом
- **TagBubblesCanvas**: Масштабирование под экран

## 🌙 Темная тема

### **Автоматическое переключение**
- **System preference** - автоматическое определение
- **Manual toggle** - кнопка переключения
- **LocalStorage** - сохранение выбора

### **CSS переменные**
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1f2937;
  --border-color: #e5e7eb;
}

[data-theme="dark"] {
  --bg-primary: #1f2937;
  --text-primary: #f9fafb;
  --border-color: #374151;
}
```

## ⚡ Производительность

### **Оптимизации**
- **Code splitting** - автоматическое разделение кода
- **Lazy loading** - загрузка компонентов по требованию
- **Image optimization** - автоматическая оптимизация изображений
- **Service Worker** - кэширование статических ресурсов

### **Метрики**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🧪 Тестирование

### **Unit тесты (Vitest)**
```typescript
// example.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Component from './Component.svelte';

describe('Component', () => {
  it('renders correctly', () => {
    const { container } = render(Component);
    expect(container).toBeTruthy();
  });
});
```

### **E2E тесты (Playwright)**
```typescript
// homepage.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('JSPulse');
});
```

## 📦 Сборка и деплой

### **Development**
```bash
pnpm run dev
# http://localhost:3000
```

### **Production build**
```bash
pnpm run build
pnpm run preview
```

### **Docker**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🔍 Отладка

### **DevTools**
- **Svelte DevTools** - отладка компонентов
- **Redux DevTools** - отладка store
- **Network tab** - мониторинг API запросов

### **Логирование**
```typescript
import { logger } from '$lib/utils/logger';

logger.debug('Debug info', { data });
logger.info('Info message');
logger.warn('Warning');
logger.error('Error occurred', error);
```

## 📚 Документация

### **Компоненты**
- [Filters](./src/lib/components/Filters.svelte) - система фильтрации
- [VacancyCard](./src/lib/components/VacancyCard/) - карточки вакансий
- [TagBubblesCanvas](./src/lib/components/TagBubblesCanvas.svelte) - пузыри навыков

### **Stores**
- [vacancyStore](./src/lib/stores/vacancyStore.ts) - управление вакансиями
- [themeStore](./src/lib/stores/themeStore.ts) - управление темой

### **Утилиты**
- [dayjs.utils](./src/lib/utils/dayjs.utils.ts) - работа с датами
- [sanitize](./src/lib/utils/sanitize.ts) - санитизация данных

## 🤝 Вклад в разработку

### **Стиль кода**
- Следуйте существующим паттернам
- Используйте TypeScript для всех файлов
- Добавляйте JSDoc комментарии для сложных функций
- Следуйте SvelteKit conventions

### **Компоненты**
- Создавайте переиспользуемые компоненты
- Используйте props для конфигурации
- Добавляйте accessibility атрибуты
- Тестируйте все компоненты

### **Store**
- Используйте TypeScript для типизации
- Следуйте Svelte store patterns
- Добавляйте валидацию данных
- Логируйте изменения состояния

---

**JSPulse Frontend - современный, быстрый и удобный интерфейс для поиска IT вакансий!** 🎯✨ 