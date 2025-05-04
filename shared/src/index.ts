// Экспортируем типы
export * from './types/index.js';

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

// Примечание: Экспорт схем удален, т.к. вызывает конфликты с типами
// Схемы можно импортировать напрямую из 'schemas/index.js' или конкретных файлов

// Для приложений, нуждающихся в схемах, рекомендуется явный импорт:
// import { VacancyDTOSchema } from '@jspulse/shared/schemas/vacancy.schema.js';

// Клиентский код должен импортировать z напрямую из 'zod' 