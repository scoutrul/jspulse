import type { PaginatedVacanciesResponse, VacancyDTO } from "@jspulse/shared";
import { fetchApiData } from "$lib/api/http.server";
import { transformVacancies, extractSkillsFromVacancies } from "$lib/utils/vacancyTransformations";
import type { VacanciesOptions, VacanciesResponse } from "./vacancy.service";

/**
 * Получение вакансий на сервере
 */
export const fetchVacanciesServer = async (
  fetch: typeof globalThis.fetch,
  options: VacanciesOptions = {},
  sanitizeHtml?: (html: string) => string
): Promise<VacanciesResponse> => {
  const { limit = 10, page = 0, skills = [] } = options;
  
  try {
    const searchParams = new URLSearchParams({
      limit: String(limit),
      page: String(page),
    });
    
    if (skills.length > 0) {
      searchParams.append('skills', skills.join(','));
    }
    
    const vacanciesPath = `api/vacancies?${searchParams.toString()}`;
    const vacanciesResponse = await fetchApiData<PaginatedVacanciesResponse>(vacanciesPath, fetch);

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
 */
export const fetchSkillsServer = async (
  fetch: typeof globalThis.fetch,
  fallbackVacancies?: VacancyDTO[]
): Promise<string[]> => {
  try {
    console.log("[vacancy.server] Запрос доступных навыков через API");
    const skillsResponse = await fetchApiData<{ data: string[] }>("api/vacancies/skills", fetch);

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