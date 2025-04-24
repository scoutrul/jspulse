// shared/types/index.ts

import type { VacancyDTO } from "./dto/vacancy.dto.js";
import type { HHVacancyRaw } from "./sources/hh.types.js";

// Экспорт базовых типов
export type { BaseVacancy } from './core/vacancy.base.ts'; // Экспортируем из одного места

// Экспорт типов для источников API
export * from "./sources/hh.types.js";
// export * from './sources/vc.types.js'; // Пример для будущего

// Экспорт типа для модели БД
export * from "./db/vacancy.model.js";

// Экспорт типа DTO для API
export * from "./dto/vacancy.dto.js";
export * from "./dto/api.dto.js";

// Интерфейс для ответа API при получении списка вакансий
export interface VacanciesApiResponse {
  status: "OK" | "ERROR";
  message: string;
  data: VacancyDTO[];
  error?: string;
}

// Интерфейс для ответа API с пагинацией
export interface PaginatedVacanciesResponse {
  status: "OK" | "ERROR";
  message: string;
  data: {
    vacancies: VacancyDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}

// Интерфейс для сырого ответа от HH API
export interface HHResponseRaw {
  items: HHVacancyRaw[];
  found: number;
  pages: number;
  per_page: number;
  page: number;
}
