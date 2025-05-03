// Убираем импорт mongoose
// import mongoose from "mongoose";
// Добавляем .js к относительным импортам и исправляем имя типа
import type { BaseVacancy } from "../core/vacancy.base.js";
// import type { HHVacancyRaw } from '../sources/hh.types.js'; // Удаляем неиспользуемый импорт

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
  rawData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Экспортируем интерфейс для модели моего без Document
// IVacancyDocument будет создан в backend и расширит IVacancy + Document
