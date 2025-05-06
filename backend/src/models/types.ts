// Заменяем дублирующиеся типы импортами из shared
import {
  VacancyDTO,
  PaginatedResponse,
  ApiSingleResponse,
  PaginatedVacanciesResponse,
  HHVacancyRaw,
  HHResponseRaw,
  HHSkill,
  IVacancy // Импортируем IVacancy из shared
} from "@jspulse/shared";

// Вместо локального определения используем импорт из shared
// IVacancy уже определен в shared/src/types/db/vacancy.model.ts

// Дополнительно экспортируем нужные типы из shared
export {
  VacancyDTO,
  PaginatedResponse,
  ApiSingleResponse,
  PaginatedVacanciesResponse,
  HHVacancyRaw,
  HHResponseRaw,
  HHSkill,
  IVacancy
};
