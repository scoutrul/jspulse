// Экспорт базовых типов
export * from "./core/vacancy.base.js";

// Экспорт типов моделей DB
export * from "./db/vacancy.model.js";

// Экспорт типов внешних источников
export * from "./sources/hh.types.js";

// Экспорт DTO
export * from "./dto/vacancy.dto.js";
export * from "./dto/api.dto.js";

// Экспорт дополнительных типов вакансий
export { 
  VacancyArea,
  VacancyEmployer,
  VacancySalary,
  VacancySnippet,
  Vacancy,
  VacanciesResponse,
  HHVacancy,
  HHResponse
} from "./vacancy.types.js"; 