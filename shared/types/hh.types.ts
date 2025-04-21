// shared/types/hh.types.ts

export interface HHVacancyArea {
  id: string;
  name: string;
}

export interface HHVacancyEmployerLogoUrls {
  '90'?: string;
  '240'?: string;
  original?: string;
}

export interface HHVacancyEmployer {
  id: string;
  name: string;
  logo_urls?: HHVacancyEmployerLogoUrls;
}

export interface HHVacancySalary {
  from?: number;
  to?: number;
  currency?: string;
  gross?: boolean;
} 

export interface HHVacancySnippet {
  requirement?: string;
  responsibility?: string;
}

export interface HHVacancy {
  id: string;
  name: string;
  area: HHVacancyArea;
  employer: HHVacancyEmployer;
  salary: HHVacancySalary | null;
  snippet: HHVacancySnippet;
  alternate_url: string;
  published_at: string;
  created_at: string;
  description?: string; // Полное описание, обычно получается отдельным запросом
}

export interface HHResponse {
  items: HHVacancy[];
  found: number;
  pages: number;
  page: number;
  per_page: number;
} 