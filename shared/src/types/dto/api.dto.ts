import type { VacancyDTO } from "./vacancy.dto.js";

/**
 * Стандартная обертка для успешного ответа API со списком данных.
 */
export interface ApiListResponse<T> {
  status: "OK";
  message?: string;
  data: T[];
}

/**
 * Стандартная обертка для успешного ответа API с одним объектом данных.
 */
export interface ApiSingleResponse<T> {
  status: "OK" | "ERROR";
  message?: string;
  data: T | null; // Может быть null, если ресурс не найден по ID, но запрос успешен
}

/**
 * Интерфейс для ответа API с пагинацией
 */
export interface PaginatedResponse<T> {
  status: "OK" | "ERROR";
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  message?: string;
}

/**
 * Тип для ответа API списка вакансий.
 */
export type VacanciesApiResponse = ApiListResponse<VacancyDTO>;

/**
 * Тип для ответа API одной вакансии.
 */
export type VacancyApiResponse = ApiSingleResponse<VacancyDTO>;

/**
 * Специализированный тип для ответа с вакансиями с пагинацией
 */
export type PaginatedVacanciesResponse = PaginatedResponse<VacancyDTO>;

/**
 * Стандартная обертка для ответа API с ошибкой.
 */
export interface ApiErrorResponse {
  status: "ERROR";
  message: string;
  error?: string; // Дополнительные детали ошибки (например, в dev режиме)
} 