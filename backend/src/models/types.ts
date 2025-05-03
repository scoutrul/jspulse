// Базовый интерфейс для вакансии
export interface IVacancy {
  externalId?: string;
  title: string;
  company: string;
  location?: string;
  url: string;
  publishedAt: Date;
  source: string;
  description?: string;
  schedule?: string;
  skills?: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  experience?: string;
  employment?: string;
  address?: string;
  rawData?: any;
}

// DTO для вакансии
export interface VacancyDTO {
  _id?: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  schedule?: string;
  description?: string;
  skills: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  url: string;
  publishedAt: string;
  experience?: string;
  employment?: string;
  address?: string;
  rawData?: any;
  htmlDescription?: string;
  source: string;
}

// Интерфейс для ответа API с пагинацией
export interface PaginatedResponse<T> {
  status: "OK" | "ERROR";
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  message?: string;
}

// Конкретизация для вакансий
export type PaginatedVacanciesResponse = PaginatedResponse<VacancyDTO>;

// Интерфейс для единичного ответа API
export interface ApiSingleResponse<T> {
  status: "OK" | "ERROR";
  data: T | null;
  message?: string;
}

// Типы для HeadHunter API
export interface HHResponseRaw {
  items: any[];
  found: number;
  pages: number;
  page: number;
  per_page: number;
}

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

export interface HHSkill {
  name: string;
}
