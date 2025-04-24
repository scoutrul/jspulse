import type { BaseVacancy } from '../core/vacancy.base.js'; // Правильный импорт

export interface VacancyDTO extends BaseVacancy {
  _id: string;
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

  // НЕ включаем rawData в DTO

  // publishedAt в BaseVacancy имеет тип Date,
  // но для DTO лучше использовать строку (ISO формат)
  // Переопределяем или трансформируем на бэкенде.
  // Пока оставим Date из BaseVacancy, трансформацию сделаем на бэке.
  publishedAt: Date; // Убираем переопределение типа, оставляем Date как в BaseVacancy
}
