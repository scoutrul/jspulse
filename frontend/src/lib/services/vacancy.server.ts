import type { PaginatedVacanciesResponse, VacancyDTO, ApiSingleResponse } from "@jspulse/shared";
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
    
    const vacanciesResponse = await httpClient.get<PaginatedVacanciesResponse>(
      "api/vacancies", 
      { params }
    );

    if (
      vacanciesResponse.status !== "OK" ||
      !vacanciesResponse.data ||
      !Array.isArray(vacanciesResponse.data.items)
    ) {
      console.error(
        `[vacancy.server] API вернул некорректные данные вакансий: status=${vacanciesResponse.status}`,
        vacanciesResponse.data
      );
      throw new Error(vacanciesResponse.message || "API не вернуло ожидаемые данные вакансий");
    }

    const { items: rawVacancies, total, page: returnedPage, limit: returnedLimit, totalPages } = vacanciesResponse.data;
    
    // Преобразуем вакансии
    const transformedVacancies = transformVacancies(rawVacancies, sanitizeHtml);

    return {
      vacancies: transformedVacancies,
      total,
      page: returnedPage,
      limit: returnedLimit,
      totalPages,
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
    const skillsResponse = await httpClient.get<{ status: string; data: string[] }>("api/vacancies/skills");

    if (skillsResponse.status === "OK" && Array.isArray(skillsResponse.data)) {
      return skillsResponse.data;
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
    const response = await httpClient.get<ApiSingleResponse<VacancyDTO>>(`api/vacancies/${id}`);

    if (!response || response.status !== "OK" || !response.data) {
      console.error(`[vacancy.server] API вернул ошибку для вакансии ${id}:`, 
        response?.status, response?.message);
      return null;
    }

    // Получаем данные вакансии
    const vacancy = response.data;
    
    // Простая обработка даты - если есть publishedAt, преобразуем в ISO строку
    // которую легко будет преобразовать в клиентском коде
    if (vacancy.publishedAt) {
      try {
        // Если строка - оставляем как есть
        if (typeof vacancy.publishedAt === 'string') {
          // Проверяем, что это валидная дата
          const testDate = new Date(vacancy.publishedAt);
          if (isNaN(testDate.getTime())) {
            vacancy.publishedAt = new Date().toISOString();
          }
        } 
        // Если это объект Date
        else if (vacancy.publishedAt instanceof Date) {
          vacancy.publishedAt = vacancy.publishedAt.toISOString();
        }
        // Если это число (timestamp)
        else if (typeof vacancy.publishedAt === 'number') {
          vacancy.publishedAt = new Date(vacancy.publishedAt).toISOString();
        }
        // Если это объект с getTime методом
        else if (typeof vacancy.publishedAt === 'object' && vacancy.publishedAt !== null && 'getTime' in vacancy.publishedAt) {
          const timestamp = vacancy.publishedAt.getTime();
          vacancy.publishedAt = new Date(timestamp).toISOString();
        }
        // Иначе - текущая дата
        else {
          vacancy.publishedAt = new Date().toISOString();
        }
      } catch (e) {
        console.error(`[vacancy.server] Ошибка обработки даты для вакансии ${id}:`, e);
        vacancy.publishedAt = new Date().toISOString();
      }
    } else {
      vacancy.publishedAt = new Date().toISOString();
    }
    
    console.log(`[vacancy.server] Дата публикации после обработки:`, vacancy.publishedAt);
    
    // Убедимся, что skills всегда массив
    if (!Array.isArray(vacancy.skills)) {
      vacancy.skills = [];
    }
    
    // Если есть описание и санитайзер, очищаем HTML
    if (vacancy.description && sanitizeHtml) {
      vacancy.htmlDescription = sanitizeHtml(vacancy.description);
    }

    return vacancy;
  } catch (error) {
    console.error(`[vacancy.server] Ошибка при загрузке вакансии ${id}:`, error);
    return null;
  }
}; 