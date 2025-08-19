# 🏗️ Clean Architecture в JSPulse

## Обзор

JSPulse использует **Clean Architecture** для обеспечения:
- ✅ Четкого разделения ответственности
- ✅ Легкости тестирования
- ✅ Независимости от внешних технологий
- ✅ Простоты поддержки и расширения

## Структура слоев

```
src/
├── domain/           # Domain Layer (самый внутренний)
│   ├── entities/     # Бизнес-сущности
│   ├── value-objects/ # Value Objects
│   ├── services/     # Domain Services
│   └── repositories/ # Domain Repository Interfaces
├── application/      # Application Layer
│   ├── use-cases/    # Use Cases/Interactors
│   ├── dto/          # Data Transfer Objects
│   └── interfaces/   # Application Interfaces
├── infrastructure/   # Infrastructure Layer
│   ├── database/     # MongoDB адаптеры
│   ├── external/     # External API адаптеры
│   ├── cache/        # Cache реализации
│   └── messaging/    # Message brokers
├── presentation/     # Presentation Layer
│   ├── controllers/  # HTTP контроллеры
│   ├── middlewares/ # Express middlewares
│   └── validators/   # Request validators
└── shared/           # Shared utilities
```

## Принципы

### 1. Dependency Rule
Зависимости идут только **внутрь**:
- Presentation → Application → Domain
- Infrastructure → Application → Domain
- **НЕ** Domain → Infrastructure

### 2. Separation of Concerns
- **Domain**: бизнес-правила и логика
- **Application**: координация между сервисами
- **Infrastructure**: внешние зависимости
- **Presentation**: HTTP логика

### 3. Dependency Inversion
- Абстракции не зависят от деталей
- Детали зависят от абстракций
- Используем интерфейсы для внешних зависимостей

## Ключевые компоненты

### Domain Entities
```typescript
// Чистые бизнес-сущности без внешних зависимостей
export class Vacancy {
  constructor(
    private readonly _id: string,
    private readonly _title: string,
    // ... другие свойства
  ) {
    this.validate(); // Бизнес-правила
  }

  // Бизнес-методы
  isActive(): boolean { /* ... */ }
  hasSkill(skillName: string): boolean { /* ... */ }
}
```

### Use Cases
```typescript
// Координация бизнес-логики
export class GetVacanciesUseCase implements IUseCaseWithParams<GetVacanciesRequest, GetVacanciesResponse> {
  constructor(
    private readonly vacancyRepository: IVacancyRepository,
    private readonly vacancyDomainService: VacancyDomainService
  ) {}

  async execute(request: GetVacanciesRequest): Promise<GetVacanciesResponse> {
    // 1. Получаем данные из репозитория
    // 2. Применяем domain логику
    // 3. Возвращаем результат
  }
}
```

### Controllers
```typescript
// Только HTTP логика, делегирует в Use Cases
export class AdminController {
  constructor(
    private readonly getSystemStatsUseCase: GetSystemStatsUseCase
  ) {}

  async getSystemStats(req: Request, res: Response): Promise<void> {
    const stats = await this.getSystemStatsUseCase.execute();
    res.json({ success: true, data: stats });
  }
}
```

## Миграция

### Phase 1: Базовая структура ✅
- Создана структура папок
- Базовые интерфейсы
- Простой Use Case для навыков

### Phase 2: Domain Layer ✅
- Domain entities (Vacancy, Skill, Salary, Company)
- Domain services (VacancyDomainService)
- Use Cases для вакансий

### Phase 3: Application Layer ✅
- Use Cases для системной статистики
- Controllers для административных операций
- Новые routes с Clean Architecture

### Phase 4: Финальная очистка 🔄
- Удаление отладочной информации
- Оптимизация существующего кода
- Документация

## Использование

### Новые endpoints (Clean Architecture)
```bash
# Навыки
GET /api/skills

# Административные операции
GET /api/admin-clean/stats
GET /api/admin-clean/recent-vacancies
POST /api/admin-clean/clear-cache

# Вакансии (через Use Cases)
GET /api/vacancies?skills=react&limit=10
```

### Старые endpoints (пока работают)
```bash
# Административные операции
GET /api/admin/stats
GET /api/admin/top-skills
GET /api/admin/recent
```

## Преимущества

1. **Тестируемость**: легко создавать unit тесты
2. **Поддерживаемость**: четкое разделение ответственности
3. **Расширяемость**: простое добавление новых функций
4. **Независимость**: легко заменить технологии
5. **Читаемость**: понятная структура кода

## Следующие шаги

1. **Полная миграция**: заменить все старые routes
2. **Тесты**: покрыть Use Cases и Controllers
3. **Валидация**: добавить request validation
4. **Обработка ошибок**: унифицировать error handling
5. **Логирование**: добавить structured logging

## Примеры рефакторинга

### До (нарушение принципов)
```typescript
// adminRoutes.ts - бизнес-логика в routes
router.get("/stats", async (req: Request, res: Response) => {
  const { VacancyRepository } = await import('../repositories/VacancyRepository.js');
  const vacancyRepo = new VacancyRepository();
  
  // Бизнес-логика прямо в route!
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent24h = await vacancyRepo.count({ createdAt: yesterday });
  
  res.json({ success: true, data: { recent24h } });
});
```

### После (Clean Architecture)
```typescript
// AdminController - только HTTP логика
export class AdminController {
  async getSystemStats(req: Request, res: Response): Promise<void> {
    const stats = await this.getSystemStatsUseCase.execute();
    res.json({ success: true, data: stats });
  }
}

// GetSystemStatsUseCase - бизнес-логика
export class GetSystemStatsUseCase {
  async execute(): Promise<SystemStatsResponse> {
    const repoStats = await this.vacancyRepository.getStatistics();
    const workFormatStats = this.calculateWorkFormatStats(domainVacancies);
    return { /* ... */ };
  }
}
```

## Заключение

Clean Architecture в JSPulse обеспечивает:
- 🎯 **Четкость**: каждый слой имеет свою ответственность
- 🧪 **Тестируемость**: легко создавать и поддерживать тесты
- 🔄 **Гибкость**: простое изменение и расширение
- 📚 **Читаемость**: понятная структура для новых разработчиков
- 🚀 **Масштабируемость**: готовность к росту проекта
