# System Patterns

## Архитектурные слои
- **Presentation**: SvelteKit компоненты, страницы, stores
- **Service**: Бизнес-логика, API клиенты, VacancyService  
- **Repository**: Абстракция доступа к данным (VacancyRepository)
- **Infrastructure**: MongoDB, Cache, DI Container, внешние API

## Паттерны проектирования

### Основные паттерны (Level 2)
- **Repository Pattern**: IRepository<T>, IVacancyRepository - абстракция доступа к данным
- **Dependency Injection**: DIContainer с lifecycle management (Singleton/Transient/Scoped)
- **Cache Pattern**: MemoryCacheService с TTL и LRU eviction
- **Factory Method**: ContainerFactory для разных environment

### Устоявшиеся паттерны (Level 1)
- **Adapter**: единый интерфейс доступа к HeadHunter API
- **DTO**: структурированная передача данных между слоями  
- **Value Object**: валидация и инкапсуляция значений
- **Fail-fast**: валидация данных на раннем этапе через Zod

## Принципы архитектуры
- **Separation of Concerns**: четкое разделение ответственности
- **Inversion of Control**: зависимости внедряются через DI Container  
- **Single Responsibility**: каждый класс имеет одну причину для изменения
- **Open/Closed**: открыты для расширения, закрыты для модификации

## Валидация и типизация
- Все входные данные проходят валидацию через Zod schemas
- TypeScript обеспечивает статическую типизацию (100% без any)
- Fail-fast валидация на границах системы
- Shared типы синхронизируются между модулями

## Enterprise паттерны
- **Graceful Shutdown**: корректное завершение всех сервисов
- **Health Checks**: мониторинг состояния системы (/health, /cache/stats)
- **Configuration Management**: централизованная настройка через ContainerFactory
- **Request Scoping**: изоляция зависимостей на уровне HTTP запроса

## Модули
- backend (Express, TypeScript)
- frontend (SvelteKit)
- shared (DTO, типы)

## Использование ES-модулей, pnpm workspaces, Docker

## Процессы
- Все изменения в типах — только через shared/types, с пересборкой и синхронизацией.
- Использование централизованного логирования (debug, info, warn, error).
- Docker Compose для локальной разработки и продакшена.

## Актуальность архитектуры и API
- В проекте запрещено использовать устаревшие (deprecated) API.
- Все архитектурные решения и паттерны должны быть основаны на последних стабильных рекомендациях официальной документации.
- При внедрении новых технологий или паттернов обязательно сверяться с документацией и MCP/Context7. 