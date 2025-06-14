import type { BaseVacancy } from "../core/vacancy.base.js";

/**
 * Интерфейс для обработанного контента описания вакансии
 */
export interface DescriptionContent {
  raw: string;           // Исходный HTML
  preview: string;       // Краткая версия для превью
  processed: string;     // Обработанный HTML под дизайн-систему
  textOnly: string;      // Plain text версия
}

/**
 * Интерфейс для документа вакансии в MongoDB.
 * Расширяет BaseVacancy и добавляет специфичные для БД поля.
 */
export interface IVacancy extends Omit<BaseVacancy, 'publishedAt'> {
  // Переопределяем publishedAt как Date (в БД храним как Date)
  publishedAt: Date;

  // Дополнительные нормализованные поля, хранящиеся в БД
  description?: string;
  fullDescription?: string;     // Полное HTML описание с HH.ru
  processedHtml?: string;       // Кэшированный обработанный HTML

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