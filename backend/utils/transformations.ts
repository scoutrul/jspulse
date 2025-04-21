import { IVacancy } from '../models/Vacancy.d';

// Интерфейсы, описывающие структуру вакансии с HH API
interface HHEmployer {
  name: string;
}

interface HHArea {
  name: string;
}

interface HHSalary {
  from: number | null;
  to: number | null;
  currency: string;
}

interface HHSchedule {
  name: string;
}

interface HHSkill {
  name: string;
}

export interface HHVacancyResponseItem {
  id: string;
  name: string;
  employer: HHEmployer;
  area: HHArea;
  schedule: HHSchedule;
  description: string;
  key_skills: HHSkill[];
  salary: HHSalary | null;
  alternate_url: string;
  published_at: string;
}

/**
 * Трансформирует объект вакансии из формата HH API 
 * в формат внутренней модели IVacancy.
 */
export function transformHHVacancy(hhVacancy: HHVacancyResponseItem): Omit<IVacancy, 'source'> {
  return {
    externalId: hhVacancy.id,
    title: hhVacancy.name,
    company: hhVacancy.employer.name,
    location: hhVacancy.area.name,
    schedule: hhVacancy.schedule?.name,
    description: hhVacancy.description,
    skills: hhVacancy.key_skills.map((skill: HHSkill) => skill.name),
    salaryFrom: hhVacancy.salary?.from ?? undefined,
    salaryTo: hhVacancy.salary?.to ?? undefined,
    salaryCurrency: hhVacancy.salary?.currency,
    url: hhVacancy.alternate_url,
    publishedAt: new Date(hhVacancy.published_at)
  };
} 