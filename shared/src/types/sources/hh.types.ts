/**
 * Типы данных для HeadHunter API
 */

// Определения типов для СЫРОГО ответа от HeadHunter API

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
  "90"?: string;
  "240"?: string;
  original?: string;
}

export interface HHEmployer {
  id: string;
  name: string;
  url?: string | null;
  alternate_url?: string | null;
  logo_urls?: HHEmployerLogoUrls | null;
  vacancies_url?: string | null;
  accredited_it_employer?: boolean | null;
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

// --- Основной интерфейс СЫРОЙ вакансии HH ---
export interface HHVacancyRaw {
  id: string;
  name: string;
  area: any;
  salary: any;
  employer: any;
  published_at: string;
  created_at: string;
  alternate_url: string;
  snippet: any;
  key_skills?: HHSkill[];
  schedule?: {
    id: string;
    name: string;
  };
  description?: string;
  experience?: {
    id: string;
    name: string;
  };
  employment?: {
    id: string;
    name: string;
  };
  address?: {
    city?: string;
    street?: string;
    building?: string;
    description?: string;
    raw?: string;
    metro?: {
      station_name?: string;
      line_name?: string;
    };
  };
}

// --- Интерфейс СЫРОГО ответа списка вакансий ---
export interface HHResponseRaw {
  items: any[];
  found: number;
  pages: number;
  page: number;
  per_page: number;
} 