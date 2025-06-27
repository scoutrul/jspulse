import mongoose from 'mongoose';
import type { DescriptionContent } from "../types/DescriptionContent.js";

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
export interface IVacancyDocument extends IVacancy {
  _id: any;
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

// ПРОСТАЯ НОРМАЛЬНАЯ СХЕМА БЕЗ ЕБАНЫХ ПРОКСИ!
const vacancySchema = new mongoose.Schema(
  {
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
    },
    processedHtml: { type: String },
    schedule: { type: String },
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

    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "vacancies",
  }
);

// Индекс для быстрой сортировки
vacancySchema.index({ publishedAt: -1 });

// ПРОСТАЯ НОРМАЛЬНАЯ МОДЕЛЬ КАК У ВСЕХ ЛЮДЕЙ!
export const Vacancy = mongoose.model<IVacancyDocument>("Vacancy", vacancySchema);
