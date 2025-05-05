import { z } from "zod";
import { VacancyDTOSchema } from "./vacancy.schema.js";

/**
 * Схема для ошибки API
 */
export const ApiErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  details: z.any().optional(),
});

/**
 * Схема для метаданных пагинации
 */
export const PaginationSchema = z.object({
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

/**
 * Общая схема успешного API-ответа
 */
export const ApiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  meta: z.any().optional(),
});

/**
 * Общая схема неуспешного API-ответа
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

/**
 * Схема для API-ответа со списком вакансий и пагинацией
 */
export const VacancyListResponseSchema = ApiSuccessSchema.extend({
  data: z.array(VacancyDTOSchema),
  meta: PaginationSchema,
});

/**
 * Схема для API-ответа с одной вакансией
 */
export const SingleVacancyResponseSchema = ApiSuccessSchema.extend({
  data: VacancyDTOSchema,
});

/**
 * Объединенная схема для любого API-ответа
 */
export const ApiResponseSchema = z.union([
  ApiSuccessSchema,
  ApiErrorResponseSchema,
]);

// Экспортируем типы, выведенные из схем
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ApiSuccess<T = any, M = any> = z.infer<typeof ApiSuccessSchema> & { data: T; meta?: M };
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type VacancyListResponse = z.infer<typeof VacancyListResponseSchema>;
export type SingleVacancyResponse = z.infer<typeof SingleVacancyResponseSchema>;
export type ApiResponse<T = any, M = any> = ApiSuccess<T, M> | ApiErrorResponse; 