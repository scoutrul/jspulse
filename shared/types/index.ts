// shared/types/index.ts

import type { VacancyDTO } from "./dto/vacancy.dto.js";
// import type { HHVacancyRaw } from "./sources/hh.types.js"; // Удаляем неиспользуемый импорт

// Типы для моделирования базовых сущностей и БД
export * from "./db/vacancy.model.js";
export * from "./core/vacancy.base.js"; // VacancySource экспортируется отсюда

// Типы для источников API
export * from "./sources/hh.types.js";

// Типы DTO (Data Transfer Objects) для API ответов
export * from "./dto/vacancy.dto.js";
export * from "./dto/api.dto.js"; // Общие типы ответов API

// Интерфейс для ответа API с пагинацией
export interface PaginatedResponse<T> {
  status: "OK" | "ERROR";
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null; // data может быть null при ошибках
  message?: string;
}

// Конкретизация для вакансий
export type PaginatedVacanciesResponse = PaginatedResponse<VacancyDTO>;
