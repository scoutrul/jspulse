# Tech Context

## Основной стек
- **Языки**: TypeScript (100% кодовая база), JavaScript ES-модули
- **Frontend**: SvelteKit + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: Firebase Auth (Google OAuth) + Firebase Admin SDK
- **Package Manager**: pnpm + workspaces (монорепозиторий)

## Архитектурные технологии (Level 2)
- **Repository Pattern**: абстракция доступа к данным  
- **Dependency Injection**: собственный DI Container
- **Caching**: In-memory кэш с TTL и LRU eviction
- **Validation**: Zod для runtime валидации
- **HTTP Client**: Централизованный apiClient с автоматической аутентификацией
- **Authentication Middleware**: Firebase JWT валидация для админских роутов

## Инструменты разработки
- **Контейнеризация**: Docker + Docker Compose
- **Линтинг**: ESLint + Prettier + Husky + lint-staged
- **Build System**: Custom build.js для shared модуля
- **Type Safety**: Строгий TypeScript без any типов

## Производственные возможности
- **Health Monitoring**: endpoints для мониторинга состояния
- **Graceful Shutdown**: корректное завершение приложения
- **Performance**: 60-80% улучшение благодаря кэшированию
- **Scalability**: готовность к горизонтальному масштабированию

## CI/CD и развертывание  
- **Local Development**: Docker Compose для полной изоляции
- **Build Process**: автоматическая сборка shared типов
- **Environment Management**: различные конфигурации через ContainerFactory 