import type { BaseVacancy } from "../core/vacancy.base"; // Используем type-only import

/**
 * Интерфейс для документа вакансии в MongoDB.
 * Расширяет BaseVacancy и добавляет специфичные для БД поля.
 */
export interface IVacancy extends BaseVacancy {
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
  rawData?: any;

  // Поля Mongoose НЕ указываем здесь, они добавятся в типе IVacancyDocument в backend
  // _id?: any;
  // createdAt?: Date;
  // updatedAt?: Date;
}

// Удаляем IVacancyDocument отсюда
// export type IVacancyDocument = IVacancy & Document;
