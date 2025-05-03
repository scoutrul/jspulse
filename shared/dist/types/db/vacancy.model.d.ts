import type { BaseVacancy } from "../core/vacancy.base.js";

/**
 * Интерфейс для документа вакансии в MongoDB.
 * Расширяет BaseVacancy и добавляет специфичные для БД поля.
 */
export interface IVacancy extends Omit<BaseVacancy, 'publishedAt'> {
  // Переопределяем publishedAt как Date (в БД храним как Date)
  publishedAt: Date;
  
  // Дополнительные нормализованные поля, хранящиеся в БД
  description?: string;
  schedule?: string;
  skills: string[]; // Массив навыков для фильтрации
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  experience?: string;
  employment?: string;
  address?: string;

  // Поле для хранения оригинальных данных от API
  rawData?: any;
} 