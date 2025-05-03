import type { BaseVacancy } from "../core/vacancy.base.js";

export {}; // interface VacancyDTO extends BaseVacancy {
  _id?: string; // MongoDB ID становится опциональным, т.к. при создании его может не быть
  source: string;

  description?: string;
  schedule?: string;
  skills: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  experience?: string;
  employment?: string;
  address?: string;
  publishedAt: Date;
  htmlDescription?: string; // Поле для очищенного HTML описания
} 