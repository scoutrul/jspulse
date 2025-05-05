import type { VacancyDTO } from "@jspulse/shared";

/**
 * Преобразует сырые данные вакансий в формат, удобный для отображения
 */
export const transformVacancies = (
  vacancies: VacancyDTO[],
  sanitizeHtml?: (html: string) => string
): (VacancyDTO & { htmlDescription?: string })[] => {
  return vacancies.map((vacancy) => ({
    ...vacancy,
    publishedAt: new Date(vacancy.publishedAt),
    // Преобразуем null значения в undefined для совместимости с типом VacancyDTO
    salaryFrom: vacancy.salaryFrom === null ? undefined : vacancy.salaryFrom,
    salaryTo: vacancy.salaryTo === null ? undefined : vacancy.salaryTo,
    // Приоритизируем существующее htmlDescription, если оно есть
    htmlDescription: vacancy.htmlDescription
      ? vacancy.htmlDescription
      : vacancy.description
        ? sanitizeHtml
          ? sanitizeHtml(vacancy.description)
          : vacancy.description
        : "",
    // Гарантируем, что skills всегда будет массивом
    skills: vacancy.skills && Array.isArray(vacancy.skills) ? vacancy.skills : [],
  }));
};

/**
 * Извлекает уникальные навыки из списка вакансий
 */
export const extractSkillsFromVacancies = (vacancies: VacancyDTO[]): string[] => {
  const allSkills = new Set<string>();

  vacancies.forEach((vacancy) => {
    vacancy.skills?.forEach((skill: string) => {
      if (skill && typeof skill === "string") {
        allSkills.add(skill.trim());
      }
    });
  });

  return Array.from(allSkills).sort();
}; 