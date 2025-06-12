export * from './types/index.js';

// Явно экспортируем DI интерфейсы
export { IDIContainerFactory, IDIContainer, DI_TOKENS, ServiceLifetime } from './types/core/di-container.interface.js';
export { ICacheService } from './types/core/cache.interface.js';

// Явно экспортируем необходимые схемы для бэкенда
export {
  VacancyDTOSchema,
  VacancySearchSchema,
  BaseVacancySchema,
  CreateVacancySchema,
  UpdateVacancySchema,
  ApiResponseSchema,
  ApiErrorSchema,
  ApiSuccessSchema
} from './schemas/index.js';

// Экспортируем константы
export * from './constants/pagination.constants.js';

// Примечание: Схемы можно импортировать напрямую из 'schemas/index.js' или конкретных файлов, например:
// import { VacancyDTOSchema } from '@jspulse/shared/schemas/vacancy.schema.js';

// Клиентский код должен импортировать z напрямую из 'zod' 