import mongoose, { Schema, Document } from "mongoose";
import { type BaseVacancy, type IVacancy } from "@jspulse/shared";

// Интерфейс документа Mongoose для вакансии, расширяет IVacancy из shared
export interface IVacancyDocument extends IVacancy, Document {
  // Все поля уже определены в IVacancy
  // publishedAt определен в IVacancy как Date

  // Сырые данные из источника
  rawData?: any;
}

// Схема для MongoDB
const vacancySchema = new Schema<IVacancyDocument>(
  {
    externalId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    url: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    source: { type: String, required: true },
    description: { type: String },
    schedule: { type: String },
    skills: [{ type: String }], // Массив строк для навыков/тегов
    salaryFrom: { type: Number },
    salaryTo: { type: Number },
    salaryCurrency: { type: String },
    experience: { type: String },
    employment: { type: String },
    address: { type: String },
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "vacancies",
  }
);

// Индексы для оптимизации запросов
vacancySchema.index({ publishedAt: -1 });
vacancySchema.index({ skills: 1 }); // Индекс для быстрой фильтрации по навыкам

export const Vacancy = mongoose.model<IVacancyDocument>("Vacancy", vacancySchema);
