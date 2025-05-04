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
    // Если передан санитайзер, используем его, иначе просто копируем description
    htmlDescription: vacancy.description 
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