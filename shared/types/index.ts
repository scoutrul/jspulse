// shared/types/index.ts

import type { VacancyDTO } from "./vacancy.dto";
import type { HHVacancyRaw } from "./sources/hh.types";

// Экспорт базовых типов
export * from "./core/vacancy.base";

// Экспорт типов для источников API
export * from "./sources/hh.types";
// export * from './sources/vc.types'; // Пример для будущего

// Экспорт типа для модели БД
export * from "./db/vacancy.model";

// Экспорт типа DTO для API
export * from "./dto/vacancy.dto";
export * from "./dto/api.dto";

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
