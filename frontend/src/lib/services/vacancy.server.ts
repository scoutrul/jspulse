import { VacancyApi, type VacanciesOptions, type VacanciesResponse } from "$lib/api/vacancy.api";
import type { VacancyDTO } from "@jspulse/shared";

// Экспортируем типы для использования в других модулях
export { type VacanciesOptions, type VacanciesResponse } from "$lib/api/vacancy.api";

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
  // Создаем экземпляр API для использования на сервере, передавая функцию fetch
  const vacancyApi = new VacancyApi({ fetch });
  return vacancyApi.fetchVacancies(options);
};

/**
 * Получение доступных навыков на сервере
 * 
 * @param fetch Функция fetch из SvelteKit
 */
export const fetchSkillsServer = async (
  fetch: typeof globalThis.fetch
): Promise<string[]> => {
  // Создаем экземпляр API для использования на сервере
  const vacancyApi = new VacancyApi({ fetch });
  return vacancyApi.fetchSkills();
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
  // Создаем экземпляр API для использования на сервере
  const vacancyApi = new VacancyApi({ fetch });
  return vacancyApi.fetchVacancyById(id, sanitizeHtml);
}; 