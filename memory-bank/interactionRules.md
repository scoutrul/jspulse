# Правила взаимодействия и автоматизации

## Взаимодействие
- Общаемся только на русском языке.
- Я — ассистент-исполнитель, ты — ведущий.
- Я не спрашиваю, нужно ли подготовить команду для коммита — всегда сразу предлагаю готовую команду, ты решаешь запускать её или нет.
- Все изменения в коде выполняю только после согласования.
- Перед каждым изменением формирую чёткий план и согласовываю его с тобой.
- Использую встроенные инструменты анализа (поиск, структура, логи) для принятия решений.
- После каждого этапа сообщаю о статусе и следующих шагах.

## Автоматизация
- Все действия с Memory Bank (чтение, обновление, коммиты) выполняю сам, без дополнительных запросов.
- Memory Bank всегда должен быть актуальным и отражать текущее состояние проекта.
- После значимых изменений — обновляю соответствующие файлы Memory Bank и делаю коммит.
- Если появляются новые паттерны, архитектурные решения или процессы — фиксирую их в Memory Bank.

## Использование актуальных технологий
- Перед внедрением или использованием любого API, функции или паттерна обязательно сверяйся с официальной документацией и/или Context7 MCP.
- Не используй устаревшие (deprecated) методы, даже если они работают — всегда ищи актуальный способ.
- Если не уверен — делай MCP-запрос и фиксируй ссылку на источник в Memory Bank при внедрении нового решения.
- Все новые решения должны быть совместимы с текущей стабильной версией используемых технологий.

# Правила взаимодействия для JSPulse Development

## 🎯 Общие правила разработки

### Коммуникация на русском языке
- Все объяснения, комментарии и документация на русском
- Комментарии в коде на английском для лучшей совместимости
- Переменные и функции используют английские названия

### Архитектурные принципы
- Следуем SOLID принципам и Clean Architecture
- Используем TypeScript строго (без any типов)
- Применяем Repository Pattern и Dependency Injection
- Максимальное покрытие тестами (текущая цель: 100% unit tests)

## 🤖 АВТОМАТИЧЕСКОЕ ИСПОЛЬЗОВАНИЕ MCP СЕРВЕРОВ

### 📋 Testing & Quality Assurance

#### При работе с тестами ВСЕГДА использовать:
```
🔧 Jest MCP - для любых testing задач:
- Создание unit tests
- Генерация mocks и stubs  
- Анализ test coverage
- Исправление failing tests
- Integration test scenarios

Триггеры:
- "создай тест", "добавь тестирование", "протестируй"
- "test coverage", "unit test", "mock"
- "исправь тест", "failing test"
```

#### При сложном анализе тестирования:
```
🧠 Sequential Thinking - для планирования:
- Архитектура testing strategy
- Анализ сложных testing scenarios
- Планирование E2E tests
- Debugging комплексных test failures

Триггеры:
- "проанализируй тестирование", "спланируй тесты"
- "архитектура тестов", "testing strategy"
```

### 🎨 Frontend Development

#### При работе с UI/стилизацией ВСЕГДА использовать:
```
🎨 Tailwind-Svelte Assistant - для всех UI задач:
- Создание/оптимизация Tailwind стилей
- Responsive design
- Accessibility improvements
- Design system components
- CSS optimization

Триггеры:
- "стили", "дизайн", "UI", "styling"
- "responsive", "адаптивный"
- "Tailwind", "CSS"
- "компонент", "design system"
```

#### При UI тестировании:
```
🎭 Playwright - для E2E и UI testing:
- Тестирование UI компонентов
- Screenshot testing
- Responsive behavior testing
- User interaction scenarios

Триггеры:
- "протестируй UI", "E2E test"
- "скриншот", "screenshot"
- "пользовательский сценарий"
```

### 🗄️ Backend Development

#### При работе с базой данных ВСЕГДА использовать:
```
🗃️ MongoDB MCP - для всех DB операций:
- Запросы к базе данных
- Анализ производительности
- Создание агрегаций
- Проверка данных
- Индексы и оптимизация

Триггеры:
- "MongoDB", "база данных", "БД"
- "запрос", "агрегация", "индекс"
- "данные вакансий", "коллекция"
```

#### При работе с кэшированием:
```
⚡ Redis MCP - для кэш операций:
- Настройка кэширования
- Проверка кэш статуса
- Очистка кэша
- Анализ hit rate

Триггеры:
- "кэш", "cache", "Redis"
- "кэширование", "производительность"
```

### 🚀 Infrastructure & Deployment

#### При работе с контейнерами ВСЕГДА использовать:
```
🐳 Docker MCP - для всех Docker задач:
- Управление контейнерами
- Проверка статуса сервисов
- Анализ логов
- Docker-compose операции

Триггеры:
- "Docker", "контейнер"
- "docker-compose", "сервис"
- "логи", "статус контейнера"
```

#### При работе с Git:
```
🗂️ Git MCP - для version control:
- Создание веток
- Коммиты и пуши
- Анализ истории
- Git операции

Триггеры:
- "Git", "коммит", "ветка"
- "история изменений", "merge"
```

### 🔬 Analysis & Planning

#### При сложном анализе ВСЕГДА использовать:
```
🧠 Sequential Thinking - для глубокого анализа:
- Архитектурные решения
- Планирование новых features
- Анализ производительности
- Debugging сложных проблем
- Strategic planning

Триггеры:
- "проанализируй", "спланируй"
- "архитектура", "стратегия"
- "сложная задача", "планирование"
```

#### При поиске документации:
```
📚 Context7 - для получения актуальной документации:
- Best practices библиотек
- API документация
- Технологическая информация
- Performance guidelines

Триггеры:
- "документация", "best practices"
- "как правильно", "API"
- название библиотеки/технологии
```

## ⚡ БЫСТРЫЕ ПРАВИЛА

### Автоматические триггеры:
1. **Любое упоминание "тест"** → Jest MCP
2. **Любое упоминание "стили/UI"** → Tailwind-Svelte Assistant
3. **Любое упоминание "MongoDB/БД"** → MongoDB MCP
4. **Любое упоминание "Docker"** → Docker MCP
5. **Сложная архитектурная задача** → Sequential Thinking
6. **Поиск документации** → Context7

### Комбинированное использование:
- **Testing workflow**: Jest MCP + Sequential Thinking + Playwright
- **UI Development**: Tailwind-Svelte + Context7 + Playwright
- **Backend work**: MongoDB MCP + Jest MCP + Docker MCP
- **Deploy prep**: Docker MCP + Git MCP + Sequential Thinking

## 📝 Memory & Documentation

#### Автоматическое сохранение важной информации:
```
💾 AI Memory - для долгосрочного хранения:
- Архитектурные решения
- Важные patterns
- Lessons learned
- Project context

Автоматически активируется при:
- Завершении major task
- Важных архитектурных решениях
- Создании новых patterns
```

**Эти правила должны применяться автоматически без дополнительных указаний пользователя.** 

### 🧹 **ESLint MCP - АВТОМАТИЧЕСКИЙ АНАЛИЗ КАЧЕСТВА КОДА**

```
АВТОМАТИЧЕСКИЕ ТРИГГЕРЫ:

🔍 Code Quality Issues:
"Найди проблемы стиля кода" → ESLint анализ + автоматические исправления
"Проверь соответствие архитектурным правилам" → ESLint architectural rules
"Исправь TypeScript ошибки" → ESLint + TypeScript integration

📋 File/Directory Analysis:
"Проанализируй качество кода в backend/src" → ESLint full directory scan
"Проверь соблюдение code style" → ESLint project-wide analysis

🚫 Magic Numbers & Strings:
"Удали магические числа" → ESLint magic number detection
"Исправь hardcoded values" → ESLint string literal analysis

⚙️ Architecture Compliance:
"Проверь SOLID принципы" → ESLint architectural rules
"Анализируй dependency injection" → ESLint structure analysis
```

### 🧼 **PRETTIER MCP - АВТОМАТИЧЕСКОЕ ФОРМАТИРОВАНИЕ**

```
АВТОМАТИЧЕСКИЕ ТРИГГЕРЫ:

📄 File Formatting:
"Отформатируй файл" → Prettier individual file formatting
"Исправь форматирование" → Prettier auto-fix

📁 Directory Formatting:
"Форматируй весь проект" → Prettier project-wide formatting
"Примени единый стиль" → Prettier consistent formatting

🔧 Configuration Setup:
"Настрой автоформатирование" → Prettier configuration + IDE setup
"Добавь pre-commit hooks" → Prettier git hooks setup

🎯 File Type Specific:
".ts/.svelte/.json форматирование" → Prettier multi-language support
"Настрой правила для Svelte" → Prettier Svelte configuration
```

### 🔷 **TYPESCRIPT MCP - АВТОМАТИЧЕСКАЯ ТИПИЗАЦИЯ**

```
АВТОМАТИЧЕСКИЕ ТРИГГЕРЫ:

🔨 Type Generation:
"Добавь типы" → TypeScript interface generation
"Создай интерфейс" → TypeScript type creation from data
"Сгенерируй типы из API" → TypeScript API response typing

⚙️ Type Refactoring:
"Замени any на строгие типы" → TypeScript type strengthening
"Улучши типизацию" → TypeScript advanced typing patterns
"Добавь Generic типы" → TypeScript generic implementation

🏗️ Interface Design:
"Создай Union types" → TypeScript union type creation
"Добавь Repository<T>" → TypeScript generic interfaces
"Типизируй DTO" → TypeScript data transfer object typing

🔍 Type Analysis:
"Проверь типы" → TypeScript type checking
"Найди type errors" → TypeScript error detection
```

### 🧠 **DESIGN REVIEW MCP - АВТОМАТИЧЕСКИЙ UX АНАЛИЗ**

```
АВТОМАТИЧЕСКИЕ ТРИГГЕРЫ:

🎨 UI Analysis:
"Оцени интерфейс" → Design Review comprehensive UI analysis
"Проверь пользовательский опыт" → Design Review UX evaluation
"Анализируй удобство" → Design Review usability assessment

📱 Responsive Analysis:
"Проверь mobile версию" → Design Review responsive design analysis
"Оцени адаптивность" → Design Review cross-device evaluation

♿ Accessibility Review:
"Проверь доступность" → Design Review accessibility compliance
"Анализируй a11y" → Design Review WCAG compliance check

🎯 Component Review:
"Оцени компонент [name]" → Design Review component-specific analysis
"Проверь визуальную иерархию" → Design Review information architecture
```

### 🚀 **DEPLOY MCP - АВТОМАТИЗАЦИЯ CI/CD**

```
АВТОМАТИЧЕСКИЕ ТРИГГЕРЫ:

⚙️ CI/CD Setup:
"Настрой автодеплой" → Deploy MCP GitHub Actions generation
"Создай CI pipeline" → Deploy MCP automated pipeline setup
"Добавь автосборку" → Deploy MCP build automation

🐳 Docker Optimization:
"Оптимизируй Dockerfile" → Deploy MCP container optimization
"Улучши Docker setup" → Deploy MCP multi-stage builds
"Настрой production образ" → Deploy MCP production configuration

🔄 Deployment Automation:
"Автоматизируй deploy процесс" → Deploy MCP deployment scripts
"Настрой staging/production" → Deploy MCP environment management
"Добавь health checks" → Deploy MCP monitoring setup

📊 Build Process:
"Настрой production сборку" → Deploy MCP build optimization
"Оптимизируй CI время" → Deploy MCP pipeline acceleration
```

## 🎯 **КОМБИНИРОВАННЫЕ WORKFLOW ПАТТЕРНЫ С НОВЫМИ СЕРВЕРАМИ**

### 🧪 **QUALITY-FIRST DEVELOPMENT**
```
1. ESLint MCP → Code quality analysis
2. TypeScript MCP → Type safety enhancement  
3. Prettier MCP → Code formatting consistency
4. Jest MCP → Test generation
5. Design Review MCP → UX validation
6. Deploy MCP → Production readiness
```

### 🎨 **DESIGN-DRIVEN DEVELOPMENT** 
```
1. Design Review MCP → UX requirements analysis
2. Tailwind-Svelte Assistant → UI component creation
3. TypeScript MCP → Component typing
4. Prettier MCP → Code formatting
5. Jest MCP → Component testing
6. Playwright MCP → E2E validation
```

### 🚀 **DEPLOYMENT-READY DEVELOPMENT**
```
1. ESLint MCP → Code quality assurance
2. TypeScript MCP → Type safety verification
3. Jest MCP → Comprehensive testing
4. Deploy MCP → CI/CD pipeline setup
5. Docker MCP → Container optimization
6. Git MCP → Version control automation
```

## 📈 **AUTOMATION EFFICIENCY METRICS**

### ⚡ **Projected Automation Coverage**
- **Code Quality**: 95% (ESLint + Prettier + TypeScript)
- **Testing**: 90% (Jest + Playwright)  
- **UI Development**: 85% (Tailwind-Svelte + Design Review)
- **Deployment**: 80% (Deploy + Docker + Git)
- **Overall Project**: **87% automated routine tasks**

### 🚀 **Development Speed Enhancement**
- **Code formatting**: 10x faster (Prettier MCP)
- **Type creation**: 5x faster (TypeScript MCP)  
- **Quality analysis**: 8x faster (ESLint MCP)
- **UX evaluation**: 6x faster (Design Review MCP)
- **Deployment setup**: 12x faster (Deploy MCP)

**🎖️ ИТОГО: JSPulse теперь имеет самую продвинутую MCP экосистему - 16 серверов с 87% автоматизацией рутинных задач!** 