import mongoose, { Schema, Document } from "mongoose";
import type { DescriptionContent } from "../types/DescriptionContent";

// Временный локальный интерфейс до исправления shared
interface IVacancy {
  externalId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  publishedAt: Date;
  source: string;
  description?: string;
  fullDescription?: DescriptionContent;
  skills: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  experience?: string;
  employment?: string;
  address?: string;

  // Telegram-специфичные поля
  sourceId?: string;
  sourceChannel?: string;
  sourceUrl?: string;
  contact?: string;
  workFormat?: string;
  hashtags?: string[];
  confidence?: number;
  parsedAt?: Date;
}

/**
 * Интерфейс для документа вакансии в MongoDB.
 * Наследует базовый интерфейс IVacancy и добавляет MongoDB-специфичные поля
 * для обеспечения совместимости с Mongoose ODM и уникальности записей.
 */
export interface IVacancyDocument extends IVacancy, Document {
  // Уникальный идентификатор из внешнего источника для предотвращения дубликатов
  externalId: string;
  title: string;
  company: string;
  // Обязательное поле location согласно интерфейсу IVacancy
  location: string;
  url: string;
  publishedAt: Date;
  source: string;
  description?: string;
  fullDescription?: DescriptionContent;       // Объект DescriptionContent с полным описанием
  processedHtml?: string;      // Кэшированный обработанный HTML
  schedule?: string;
  skills: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  experience?: string;
  employment?: string;
  address?: string;

  // Telegram-специфичные поля
  sourceId?: string;
  sourceChannel?: string;
  sourceUrl?: string;
  contact?: string;
  workFormat?: string;
  hashtags?: string[];
  confidence?: number;
  parsedAt?: Date;

  // Сохраняем исходные данные для отладки и возможных миграций
  rawData?: any;
}

/**
 * Mongoose-схема для вакансий с оптимизацией для частых запросов.
 * Использует индексацию по дате публикации для быстрой сортировки
 * и уникальность по externalId для предотвращения дубликатов.
 */
const vacancySchema = new Schema<IVacancyDocument>(
  {
    // sparse: true позволяет несколько записей с null/undefined значениями
    externalId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    url: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    source: { type: String, required: true },
    description: { type: String },
    fullDescription: {
      type: {
        raw: { type: String },
        preview: { type: String },
        processed: { type: String },
        textOnly: { type: String }
      },
      default: undefined
    },  // Объект DescriptionContent
    processedHtml: { type: String },      // Кэшированный обработанный HTML  
    schedule: { type: String },
    // Массив строк для эффективного поиска по навыкам
    skills: [{ type: String }],
    salaryFrom: { type: Number },
    salaryTo: { type: Number },
    salaryCurrency: { type: String },
    experience: { type: String },
    employment: { type: String },
    address: { type: String },

    // Telegram-специфичные поля
    sourceId: { type: String, unique: true, sparse: true },
    sourceChannel: { type: String },
    sourceUrl: { type: String },
    contact: { type: String },
    workFormat: { type: String },
    hashtags: [{ type: String }],
    confidence: { type: Number },
    parsedAt: { type: Date },

    // Mixed type для хранения произвольных данных от разных источников
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  {
    // Автоматические поля createdAt и updatedAt для аудита
    timestamps: true,
    // Отключаем версионность для упрощения API ответов
    versionKey: false,
    // Явное указание имени коллекции для консистентности
    collection: "vacancies",
  }
);

// Индекс по убыванию даты для быстрого получения свежих вакансий
vacancySchema.index({ publishedAt: -1 });

export const Vacancy = mongoose.model<IVacancyDocument>("Vacancy", vacancySchema);
