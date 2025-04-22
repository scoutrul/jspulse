// shared/types/hh.types.ts
// Определения типов для ответа от HeadHunter API
// Основано на https://github.com/hhru/api/blob/master/docs_eng/vacancies.md и реальных ответах

// --- Вспомогательные типы --- 

export interface HHAddress { 
  city?: string;
  street?: string;
  building?: string;
  raw?: string;
}

export interface HHDepartment {
  id: string;
  name: string;
}

export interface HHEmployerLogoUrls {
  '90'?: string;
  '240'?: string;
  original?: string;
}

// Объединенный и дополненный интерфейс работодателя
export interface HHEmployer {
  id: string;
  name: string;
  url?: string | null;
  alternate_url?: string | null;
  logo_urls?: HHEmployerLogoUrls | null;
  trusted?: boolean;
}

export interface HHArea {
  id: string;
  name: string;
  url?: string | null;
}

export interface HHSalary {
  from: number | null;
  to: number | null;
  currency: string | null;
  gross?: boolean | null;
}

export interface HHSchedule {
  id: string;
  name: string;
}

export interface HHSkill {
  name: string;
}

export interface HHSnippet {
  requirement?: string | null;
  responsibility?: string | null;
}

// --- Основной интерфейс вакансии (из списка и детальный) --- 

// Объединенный и наиболее полный интерфейс вакансии HH
export interface HHVacancy {
  id: string;
  name: string; // = title
  description?: string | null; // Полное описание
  branded_description?: string | null;
  key_skills?: HHSkill[] | null; 
  schedule?: HHSchedule | null;
  experience?: { id: string; name: string };
  employment?: { id: string; name: string };
  salary?: HHSalary | null;
  address?: HHAddress | null;
  employer: HHEmployer; 
  area: HHArea; 
  published_at: string; 
  created_at?: string;
  alternate_url: string; // URL для сайта 
  url?: string | null; // URL для API
  snippet?: HHSnippet;
  department?: HHDepartment | null;
  // ... прочие поля из HHVacancyResponseItem ...
  premium?: boolean;
  has_test?: boolean;
  response_letter_required?: boolean;
  type?: { id: string; name: string };
  response_url?: string | null;
  sort_point_distance?: number | null;
  archived?: boolean;
  apply_alternate_url?: string | null;
  insider_interview?: object | null;
  relations?: any[];
  contacts?: object | null;
  working_days?: object[] | null;
  working_time_intervals?: object[] | null;
  working_time_modes?: object[] | null;
  accept_temporary?: boolean;
  professional_roles?: { id: string; name: string }[];
  accept_incomplete_resumes?: boolean;
  accept_handicapped?: boolean;
  accept_kids?: boolean;
  adv_response_url?: string | null;
  is_adv_vacancy?: boolean;
}

// --- Интерфейс ответа списка вакансий --- 

export interface HHResponse {
  items: HHVacancy[]; // Используем обновленный HHVacancy
  found: number;
  pages: number;
  page: number;
  per_page: number;
} 