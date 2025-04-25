// Убираем импорт mongoose
// import mongoose from "mongoose";
// Добавляем .js к относительным импортам и исправляем имя типа
import type { BaseVacancy } from "../core/vacancy.base.js";
// import type { HHVacancyRaw } from '../sources/hh.types.js'; // Удаляем неиспользуемый импорт

/**
 * Интерфейс для документа вакансии в MongoDB.
 * Расширяет BaseVacancy и добавляет специфичные для БД поля.
 */
export interface IVacancy extends BaseVacancy {
  externalId?: string; // Внешний ID (например, с HH.ru)
  source: string; // Добавляем недостающее поле источника
  // Дополнительные нормализованные поля, хранящиеся в БД
  description?: string;
  schedule?: string;
  skills: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  experience?: string;
  employment?: string;
  address?: string;

  // Поле для хранения оригинальных данных от API
  rawData?: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  // Поля Mongoose НЕ указываем здесь, они добавятся в типе IVacancyDocument в backend
  // _id?: any;
  // createdAt?: Date;
  // updatedAt?: Date;
}

// Удаляем IVacancyDocument отсюда
// export type IVacancyDocument = IVacancy & Document;
