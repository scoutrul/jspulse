// import { parseHTML } from "linkedom"; // Удаляем импорт, если пакет не установлен
import type { IVacancy, HHVacancyRaw, HHSkill } from "@jspulse/shared";

// Основано на https://github.com/hhru/api/blob/master/docs_eng/vacancies.md

const SOURCE_HH = "hh.ru";

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

export function transformHHVacancyToIVacancy(hhVacancy: HHVacancyRaw): Partial<IVacancy> {
  const skills = hhVacancy.key_skills?.map((skill: HHSkill) => normalizeSkill(skill.name)) || [];

  const transformed: Partial<IVacancy> = {
    externalId: hhVacancy.id,
    title: hhVacancy.name,
    company: hhVacancy.employer?.name,
    location: hhVacancy.area?.name,
    schedule: hhVacancy.schedule?.name,
    description:
      hhVacancy.description ??
      hhVacancy.snippet?.responsibility ??
      hhVacancy.snippet?.requirement ??
      "Описание отсутствует",
    skills: Array.isArray(skills) ? skills : [],
    salaryFrom: hhVacancy.salary?.from ?? undefined,
    salaryTo: hhVacancy.salary?.to ?? undefined,
    salaryCurrency: hhVacancy.salary?.currency ?? undefined,
    url: hhVacancy.alternate_url,
    publishedAt: new Date(hhVacancy.published_at),
    source: SOURCE_HH,
    experience: hhVacancy.experience?.name,
    employment: hhVacancy.employment?.name,
    address: hhVacancy.address?.raw,
    rawData: hhVacancy,
  };

  return transformed;
}

// Функция для очистки HTML от потенциально опасных элементов
function sanitizeHTML(html: string): string {
  // Если пакет для очистки HTML не установлен, просто возвращаем исходный HTML
  // В реальном проекте здесь должна быть защита от XSS!
  return html;
  // В идеале использовать библиотеки для очистки, например:
  // const { document } = parseHTML(html);
  // return document.body.innerHTML;
}
