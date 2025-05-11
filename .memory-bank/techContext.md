# Tech Context

- Языки: TypeScript, JavaScript (ES-модули)
- Фреймворки: SvelteKit (frontend), Express (backend)
- СУБД: MongoDB
- Система сборки: pnpm, Docker, Docker Compose
- Валидация: zod, class-validator
- Линтинг и форматирование: ESLint, Prettier, Husky, lint-staged
- Архитектурные решения: слоистая структура, разделение на модули, централизованное логирование
- Использование workspaces для монорепозитория
- Общие типы и DTO — только через shared/types, сборка через build.js
- CI/CD: ручной запуск, поддержка локальной и docker-сборки 