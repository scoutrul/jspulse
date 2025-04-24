import type { IVacancy } from "@jspulse/shared";
import type { HHVacancyRaw, HHSkill } from "@jspulse/shared";

// Интерфейсы, описывающие структуру вакансии с HH API
// Основано на https://github.com/hhru/api/blob/master/docs_eng/vacancies.md
// и практическом опыте (поля могут отсутствовать или быть null)

const SOURCE_HH = "hh.ru";

/**
 * Трансформирует сырые данные вакансии HH.ru в общий формат IVacancy.
 * @param hhVacancy - Объект сырой вакансии HHVacancyRaw.
 * @returns Частичный объект IVacancy.
 */
export function transformHHVacancyToIVacancy(hhVacancy: HHVacancyRaw): Partial<IVacancy> {
  const skills = hhVacancy.key_skills?.map((skill: HHSkill) => skill.name) || [];

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
    skills: skills,
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
