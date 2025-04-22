import { IVacancy } from '../models/Vacancy.d';

// Интерфейсы, описывающие структуру вакансии с HH API
// Основано на https://github.com/hhru/api/blob/master/docs_eng/vacancies.md
// и практическом опыте (поля могут отсутствовать или быть null)

interface HHAddress { // Точная структура address не документирована в примере, делаем базовую
  city?: string;
  street?: string;
  building?: string;
  raw?: string;
}

interface HHDepartment {
  id: string;
  name: string;
}

interface HHEmployer {
  id: string;
  name: string;
  url?: string | null;
  alternate_url?: string | null;
  logo_urls?: { [key: string]: string } | null;
  trusted?: boolean;
}

interface HHArea {
  id: string;
  name: string;
  url?: string | null;
}

interface HHSalary {
  from: number | null;
  to: number | null;
  currency: string | null; // Валюта тоже может быть null
  gross?: boolean | null;
}

interface HHSchedule {
  id: string;
  name: string;
}

interface HHSkill {
  name: string;
}

// Основной интерфейс для элемента из списка /vacancies
export interface HHVacancyResponseItem {
  id: string;
  name: string; // = title
  premium?: boolean;
  department?: HHDepartment | null;
  has_test?: boolean;
  response_letter_required?: boolean;
  area: HHArea; // Обязательно по доке
  salary?: HHSalary | null;
  type?: { id: string; name: string };
  address?: HHAddress | null;
  response_url?: string | null;
  sort_point_distance?: number | null;
  published_at: string; // Обязательно по доке
  created_at?: string;
  archived?: boolean;
  apply_alternate_url?: string | null;
  insider_interview?: object | null;
  url?: string | null; // URL для API
  alternate_url: string; // URL для сайта (обязательно, используется как наш url)
  relations?: any[];
  employer: HHEmployer; // Обязательно по доке
  snippet?: { requirement?: string | null; responsibility?: string | null };
  contacts?: object | null;
  schedule?: HHSchedule | null; // Может отсутствовать
  working_days?: object[] | null;
  working_time_intervals?: object[] | null;
  working_time_modes?: object[] | null;
  accept_temporary?: boolean;
  professional_roles?: { id: string; name: string }[];
  accept_incomplete_resumes?: boolean;
  experience?: { id: string; name: string };
  employment?: { id: string; name: string };
  adv_response_url?: string | null;
  is_adv_vacancy?: boolean;
  
  // Поля, полученные при запросе полной вакансии (не из списка)
  description?: string | null; // Может отсутствовать, как мы выяснили
  branded_description?: string | null;
  key_skills?: HHSkill[] | null; // Может отсутствовать
  accept_handicapped?: boolean;
  accept_kids?: boolean;
  // ... и другие поля
}

/**
 * Трансформирует объект вакансии из формата HH API 
 * в формат внутренней модели IVacancy.
 */
export function transformHHVacancy(hhVacancy: HHVacancyResponseItem): Omit<IVacancy, 'source'> | null {
  // Базовая валидация: проверяем наличие минимально необходимых полей
  if (!hhVacancy.id || !hhVacancy.name || !hhVacancy.employer?.name || !hhVacancy.area?.name || !hhVacancy.alternate_url || !hhVacancy.published_at) {
    console.warn(`Пропуск вакансии из-за отсутствия обязательных полей: ID=${hhVacancy.id}, Name=${hhVacancy.name}`);
    return null; // Возвращаем null, если критичные поля отсутствуют
  }

  return {
    externalId: hhVacancy.id,
    title: hhVacancy.name,
    company: hhVacancy.employer.name,
    location: hhVacancy.area.name,
    schedule: hhVacancy.schedule?.name, // schedule опционально
    description: hhVacancy.description ?? (hhVacancy.snippet?.responsibility || hhVacancy.snippet?.requirement || 'Описание отсутствует'), // Пытаемся взять из snippet, если нет основного
    skills: hhVacancy.key_skills?.map((skill: HHSkill) => skill.name) ?? [], // key_skills опционально
    salaryFrom: hhVacancy.salary?.from ?? undefined,
    salaryTo: hhVacancy.salary?.to ?? undefined,
    salaryCurrency: hhVacancy.salary?.currency ?? undefined,
    url: hhVacancy.alternate_url, // alternate_url обязателен по доке
    publishedAt: new Date(hhVacancy.published_at) // published_at обязателен по доке
  };
} 