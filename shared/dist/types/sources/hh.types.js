// Определения типов для СЫРОГО ответа от HeadHunter API

// --- Вспомогательные типы ---

export {}; // interface HHAddress {
  city?: string;
  street?: string;
  building?: string;
  raw?: string;
}

export {}; // interface HHDepartment {
  id: string;
  name: string;
}

export {}; // interface HHEmployerLogoUrls {
  "90"?: string;
  "240"?: string;
  original?: string;
}

export {}; // interface HHEmployer {
  id: string;
  name: string;
  url?: string | null;
  alternate_url?: string | null;
  logo_urls?: HHEmployerLogoUrls | null;
  vacancies_url?: string | null;
  accredited_it_employer?: boolean | null;
  trusted?: boolean;
}

export {}; // interface HHArea {
  id: string;
  name: string;
  url?: string | null;
}

export {}; // interface HHSalary {
  from: number | null;
  to: number | null;
  currency: string | null;
  gross?: boolean | null;
}

export {}; // interface HHSchedule {
  id: string;
  name: string;
}

export {}; // interface HHSkill {
  name: string;
}

export {}; // interface HHSnippet {
  requirement?: string | null;
  responsibility?: string | null;
}

// --- Основной интерфейс СЫРОЙ вакансии HH ---
export {}; // interface HHVacancyRaw {
  id: string;
  name: string; // = title
  description?: string | null;
  branded_description?: string | null;
  key_skills?: HHSkill[] | null;
  schedule?: HHSchedule | null;
  experience?: { id: string; name: string };
  employment?: { id: string; name: string };
  salary?: HHSalary | null;
  address?: HHAddress | null;
  employer: HHEmployer;
  area: HHArea;
  published_at: string; // В сыром виде это строка!
  created_at?: string;
  alternate_url: string;
  url?: string | null;
  snippet?: HHSnippet;
  department?: HHDepartment | null;
  // ... прочие поля ...
  premium: boolean;
  has_test?: boolean;
  response_letter_required?: boolean;
  type?: { id: string; name: string };
  response_url?: string | null;
  sort_point_distance?: number | null;
  archived?: boolean;
  apply_alternate_url?: string | null;
  insider_interview?: object | null;
  relations?: unknown[];
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

// --- Интерфейс СЫРОГО ответа списка вакансий ---
export {}; // interface HHResponseRaw {
  items: HHVacancyRaw[]; // Используем сырой тип
  found: number;
  pages: number;
  page: number;
  per_page: number;
} 