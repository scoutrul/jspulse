import { Document, Model } from 'mongoose';

export interface IVacancy {
  externalId: string;
  title: string;
  company: string;
  location: string; // Общее местоположение (город/страна)
  schedule?: string;
  description?: string;
  skills: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  url: string;
  publishedAt: Date;
  source: string;
  
  // Новые нормализованные поля
  experience?: string;   // Опыт работы (из HH: experience.name)
  employment?: string;   // Тип занятости (из HH: employment.name)
  address?: string;      // Полный адрес строкой (из HH: address.raw)
  
  // Поле для хранения оригинальных данных от API
  rawData?: any; // Или Record<string, any>
}

export interface IVacancyDocument extends IVacancy, Document {}

export const Vacancy: Model<IVacancyDocument>; 