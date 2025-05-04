import type { VacancyDTO } from "@jspulse/shared";
import { z } from "zod";
import { transformVacancies, extractSkillsFromVacancies } from "$lib/utils/vacancyTransformations.js";
import { createHttpClient } from "$lib/utils/http/index.js";
import type { VacanciesOptions, VacanciesResponse } from "./vacancy.service.js";

// Локальное определение схем, так как в shared возникли проблемы с экспортом
const DateSchema = z.preprocess((val) => {
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return null;
}, z.date().nullable().optional());

// Базовая схема вакансии с общими полями для всех источников
const BaseVacancySchema = z.object({
  externalId: z.string(),
  title: z.string(),
  company: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  publishedAt: DateSchema,
  source: z.string()
});

// Схема DTO вакансии для передачи между бэкендом и фронтендом
const VacancyDTOSchema = BaseVacancySchema.extend({
  _id: z.string().optional(),
  description: z.string().nullable().optional(),
  schedule: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  salaryFrom: z.number().nullable().optional(),
  salaryTo: z.number().nullable().optional(),
  salaryCurrency: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  employment: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  htmlDescription: z.string().nullable().optional()
});

// Определение схем для API-ответов
const ApiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  meta: z.any().optional(),
});

const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

// Определение схем для валидации ответов API
const VacancyListResponseSchema = ApiSuccessSchema.extend({
  data: z.array(VacancyDTOSchema),
  meta: PaginationSchema,
});

const SingleVacancyResponseSchema = ApiSuccessSchema.extend({
  data: VacancyDTOSchema,
});

// Схема для поиска вакансий
const VacancySearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sortBy: z.enum(["relevance", "date", "salary"]).default("relevance"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Получение вакансий на сервере
 * 
 * @param fetch Функция fetch из SvelteKit
 * @param options Опции запроса вакансий
 * @param sanitizeHtml Опциональная функция для санитизации HTML
 */
export const fetchVacanciesServer = async (
  fetch: typeof globalThis.fetch,
  options: VacanciesOptions = {},
  sanitizeHtml?: (html: string) => string
): Promise<VacanciesResponse> => {
  const { limit = 10, page = 0, skills = [] } = options;

  // Создаем экземпляр HTTP-клиента для SSR, передавая функцию fetch
  const httpClient = createHttpClient({
    // Базовый URL будет браться из .env
  });

  try {
    const params: Record<string, string> = {
      limit: String(limit),
      page: String(page),
    };

    if (skills.length > 0) {
      params.skills = skills.join(',');
    }

    const response = await httpClient.get("api/vacancies", { params });

    // Валидируем ответ через Zod
    const parseResult = VacancyListResponseSchema.safeParse(response);

    if (!parseResult.success) {
      console.error(
        `[vacancy.server] Ошибка валидации данных API:`,
        parseResult.error
      );
      throw new Error("API вернуло данные в неожидаемом формате");
    }

    const { data: vacancies, meta: pagination } = parseResult.data;

    // Преобразуем вакансии - согласованно используем тип VacancyDTO с явным приведением типа
    const transformedVacancies = transformVacancies(vacancies as unknown as VacancyDTO[], sanitizeHtml);

    return {
      vacancies: transformedVacancies,
      total: pagination.totalItems,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  } catch (err) {
    console.error("[vacancy.server] Ошибка при загрузке вакансий:", err);
    throw err;
  }
};

/**
 * Получение доступных навыков на сервере
 * 
 * @param fetch Функция fetch из SvelteKit
 * @param fallbackVacancies Вакансии для извлечения навыков в случае ошибки API
 */
export const fetchSkillsServer = async (
  fetch: typeof globalThis.fetch,
  fallbackVacancies?: VacancyDTO[]
): Promise<string[]> => {
  // Создаем экземпляр HTTP-клиента для SSR
  const httpClient = createHttpClient();

  try {
    console.log("[vacancy.server] Запрос доступных навыков через API");
    const response = await httpClient.get("api/vacancies/skills");

    // Проверяем структуру ответа с безопасным приведением типов
    const responseObj = response as any;
    if (responseObj.success && Array.isArray(responseObj.data)) {
      return responseObj.data;
    } else if (fallbackVacancies && fallbackVacancies.length > 0) {
      // Если API не сработал, собираем навыки из полученных вакансий
      return extractSkillsFromVacancies(fallbackVacancies);
    } else {
      return [];
    }
  } catch (error) {
    console.error("[vacancy.server] Ошибка при загрузке навыков:", error);

    // Если есть fallback-вакансии, извлекаем из них навыки
    if (fallbackVacancies && fallbackVacancies.length > 0) {
      return extractSkillsFromVacancies(fallbackVacancies);
    }

    return [];
  }
};

/**
 * Получение детальной информации о вакансии на сервере
 * 
 * @param fetch Функция fetch из SvelteKit
 * @param id ID вакансии
 * @param sanitizeHtml Опциональная функция для санитизации HTML
 */
export const fetchVacancyByIdServer = async (
  fetch: typeof globalThis.fetch,
  id: string,
  sanitizeHtml?: (html: string) => string
): Promise<VacancyDTO | null> => {
  // Создаем экземпляр HTTP-клиента для SSR
  const httpClient = createHttpClient({
    fetch // Передаем fetch из контекста SvelteKit
  });

  try {
    console.log(`[vacancy.server] Запрос вакансии с ID: ${id}`);
    const response = await httpClient.get(`api/vacancies/${id}`);

    // Безопасное приведение типа для логирования
    const responseObj = response as Record<string, any>;

    // Добавляем подробное логирование ответа для диагностики
    console.log(`[vacancy.server] ДЕТАЛЬНАЯ СТРУКТУРА ОТВЕТА ДЛЯ ID ${id}:`, JSON.stringify(responseObj, null, 2));

    // Если есть дата публикации, выводим её особо для диагностики
    if (responseObj && responseObj.data && responseObj.data.publishedAt) {
      console.log(`[vacancy.server] ДАТА ПУБЛИКАЦИИ:`, {
        raw: responseObj.data.publishedAt,
        type: typeof responseObj.data.publishedAt,
        asDate: new Date(responseObj.data.publishedAt),
        isValid: !isNaN(new Date(responseObj.data.publishedAt).getTime())
      });
    }

    // Валидируем через Zod
    const parseResult = SingleVacancyResponseSchema.safeParse(response);

    if (!parseResult.success) {
      console.error(`[vacancy.server] Ошибка валидации ответа для вакансии ${id}:`, parseResult.error);
      return null;
    }

    // Получаем данные вакансии с валидацией
    const vacancyResult = VacancyDTOSchema.safeParse(parseResult.data.data);

    if (!vacancyResult.success) {
      console.error(`[vacancy.server] Ошибка валидации данных вакансии ${id}:`, vacancyResult.error);
      return null;
    }

    const vacancy = vacancyResult.data;

    // Выводим проверку даты публикации после валидации
    console.log(`[vacancy.server] ПРОВЕРКА ДАТЫ ПОСЛЕ ВАЛИДАЦИИ:`, {
      raw: vacancy.publishedAt,
      type: typeof vacancy.publishedAt,
      instanceOf: vacancy.publishedAt instanceof Date,
      isValid: vacancy.publishedAt instanceof Date && !isNaN(vacancy.publishedAt.getTime())
    });

    // Если есть описание и санитайзер, очищаем HTML
    if (vacancy.description && sanitizeHtml) {
      vacancy.htmlDescription = sanitizeHtml(vacancy.description);
    }

    console.log(`[vacancy.server] Вакансия ${id} успешно загружена и валидирована`);

    // Возвращаем вакансию с приведением типа для удовлетворения интерфейса VacancyDTO
    return vacancy as unknown as VacancyDTO;
  } catch (error) {
    console.error(`[vacancy.server] Ошибка при загрузке вакансии ${id}:`, error);
    return null;
  }
}; 