# JSPulse Frontend

SvelteKit приложение для агрегатора вакансий по JavaScript/Frontend.

## 🚨 ВАЖНО: Build процесс

### После любых значительных изменений ОБЯЗАТЕЛЬНО:

```bash
# 1. Сборка приложения
pnpm run build

# 2. Перезапуск Docker контейнера
docker-compose restart frontend
```

### Автоматизация

```bash
# Автоматический build + restart
pnpm run rebuild

# Автоматический rebuild при изменениях (для разработки)
pnpm run rebuild:watch
```

## Когда нужен rebuild?

- ✅ Добавлены новые страницы/маршруты
- ✅ Изменены .svelte компоненты
- ✅ Добавлены новые зависимости
- ✅ Изменены TypeScript типы
- ✅ Изменена конфигурация (vite.config.ts, tailwind и т.д.)

## Симптомы пропущенного rebuild

- ❌ Новые страницы возвращают 404
- ❌ Изменения в компонентах не отражаются
- ❌ TypeScript ошибки в runtime
- ❌ Функционал работает локально но не в Docker

## Разработка

### Запуск в dev режиме
```bash
pnpm run dev
```

### Полная установка зависимостей
```bash
pnpm install
```

### Проверка типов
```bash
pnpm run check
```

### Форматирование кода
```bash
pnpm run format
```

## Архитектура

```
src/
├── lib/
│   ├── api/           # API клиенты
│   ├── components/    # Svelte компоненты
│   ├── services/      # Бизнес логика
│   └── utils/         # Утилиты
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte   # Главная страница
│   └── v/[id]/        # Детальные страницы вакансий
```

## Отладка

### 404 ошибки
```bash
# Проверить сборку
ls -la build/

# Проверить логи
docker logs jspulse-frontend-1

# Полный rebuild
rm -rf build/
pnpm run rebuild
```

### TypeScript ошибки
```bash
# Проверить типы
pnpm run check

# Очистить и пересобрать
rm -rf .svelte-kit/ build/
pnpm run build
```

### Docker проблемы
```bash
# Пересборка контейнера
docker-compose build --no-cache frontend

# Проверить volume mounting
docker-compose config
```

## Зависимости

### Основные
- **SvelteKit** - фреймворк
- **TypeScript** - типизация
- **TailwindCSS** - стили
- **Vite** - сборщик

### API интеграции
- **ky** - HTTP клиент
- **zod** - валидация данных
- **@jspulse/shared** - общие типы

### Build
- **@sveltejs/adapter-node** - Node.js адаптер
- **DOMPurify + jsdom** - санитизация HTML (SSR)

## Команды

| Команда | Описание |
|---------|----------|
| `pnpm run dev` | Разработка |
| `pnpm run build` | Сборка для продакшн |
| `pnpm run rebuild` | Build + restart Docker |
| `pnpm run rebuild:watch` | Автоматический rebuild |
| `pnpm run check` | Проверка типов |
| `pnpm run format` | Форматирование |

## Важные файлы

- `vite.config.ts` - Конфигурация Vite
- `svelte.config.js` - Конфигурация SvelteKit
- `tailwind.config.js` - Конфигурация TailwindCSS
- `src/app.html` - HTML шаблон
- `Dockerfile` - Docker образ 