import type { VacancyDTO } from "@jspulse/shared";
import { vacancyApi, type VacanciesOptions, type VacanciesResponse } from "$lib/api/vacancy.api";

// Экспортируем типы для использования в других модулях
export { type VacanciesOptions, type VacanciesResponse } from "$lib/api/vacancy.api";

/**
 * Получение вакансий на клиенте.
 * Просто прокси-метод для вызова адаптера API для обратной совместимости.
 */
export const fetchVacanciesClient = async (
  options: VacanciesOptions = {}
): Promise<VacanciesResponse> => {
  return vacancyApi.fetchVacancies(options);
};

/**
 * Получение списка навыков на клиенте.
 * Просто прокси-метод для вызова адаптера API для обратной совместимости.
 */
export const fetchSkillsClient = async (
  fallbackVacancies?: VacancyDTO[]
): Promise<string[]> => {
  return vacancyApi.fetchSkills(fallbackVacancies);
};

/**
 * Получение детальной информации о вакансии на клиенте.
 * Просто прокси-метод для вызова адаптера API для обратной совместимости.
 */
export const fetchVacancyByIdClient = async (
  id: string
): Promise<VacancyDTO | null> => {
  return vacancyApi.fetchVacancyById(id);
}; 