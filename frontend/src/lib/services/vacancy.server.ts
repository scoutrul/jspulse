import { 
  VacancyDTOSchema, 
  VacancyDTO, 
  SingleVacancyResponseSchema,
  VacancyListResponseSchema,
  VacancySearchSchema,
  DateSchema
} from "@jspulse/shared";
import { transformVacancies, extractSkillsFromVacancies } from "$lib/utils/vacancyTransformations";
import { createHttpClient } from "$lib/utils/http";
import type { VacanciesOptions, VacanciesResponse } from "./vacancy.service";

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

    // Преобразуем вакансии
    const transformedVacancies = transformVacancies(vacancies, sanitizeHtml);

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
    
    // Проверяем структуру ответа
    if (response.success && Array.isArray(response.data)) {
      return response.data;
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
    
    // Если есть описание и санитайзер, очищаем HTML
    if (vacancy.description && sanitizeHtml) {
      vacancy.htmlDescription = sanitizeHtml(vacancy.description);
    }

    console.log(`[vacancy.server] Вакансия ${id} успешно загружена и валидирована`);
    
    return vacancy;
  } catch (error) {
    console.error(`[vacancy.server] Ошибка при загрузке вакансии ${id}:`, error);
    return null;
  }
}; 