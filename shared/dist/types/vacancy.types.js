import { BaseVacancy } from "./core/vacancy.base.js";

export {}; // interface VacancyArea {
  id: string;
  name: string;
  url?: string;
}

export {}; // interface VacancyEmployer {
  id: string;
  name: string;
  url?: string;
  logoUrls?: {
    original?: string;
    [key: string]: string | undefined;
  };
}

export {}; // interface VacancySalary {
  from?: number;
  to?: number;
  currency?: string;
  gross?: boolean;
}

export {}; // interface VacancySnippet {
  requirement?: string;
  responsibility?: string;
}

// Полный тип вакансии - расширяет базовый всеми полями
export {}; // interface Vacancy extends BaseVacancy {
  description?: string;
  skills: string[]; // Навыки для фильтрации
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  experience?: string;
  employment?: string;
  address?: string;
  htmlDescription?: string;
  area?: VacancyArea;
  employer?: VacancyEmployer;
  snippet?: VacancySnippet;
}

export {}; // interface VacanciesResponse {
  status: "OK" | "ERROR";
  data?: Vacancy[];
  message?: string;
}

export {}; // interface HHVacancy {
  id: string;
  name: string;
  area: VacancyArea;
  employer: VacancyEmployer;
  salary: VacancySalary | null;
  snippet: VacancySnippet;
  alternate_url: string;
  published_at: string;
  created_at: string;
  description?: string;
}

export {}; // interface HHResponse {
  items: HHVacancy[];
  found: number;
  pages: number;
  page: number;
  per_page: number;
} 