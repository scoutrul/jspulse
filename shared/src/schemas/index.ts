// Базовые схемы
export * from "./date.schema.js";
export * from "./vacancy.schema.js";
export * from "./api.schema.js";

// Удален экспорт z из zod, т.к. это создает неявные зависимости.
// Клиентский код должен импортировать z напрямую из 'zod'

// Явно реэкспортируем схемы вакансий для гарантии их доступности
export {
  BaseVacancySchema,
  VacancyDTOSchema,
  CreateVacancySchema,
  UpdateVacancySchema,
  VacancySearchSchema,
} from "./vacancy.schema.js"; 