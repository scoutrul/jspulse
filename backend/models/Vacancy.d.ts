import { Document, Model } from 'mongoose';

export interface IVacancy {
  externalId: string;
  title: string;
  company: string;
  location: string;
  schedule?: string;
  description?: string;
  skills: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  url: string;
  publishedAt: Date;
  source: string;
}

export interface IVacancyDocument extends IVacancy, Document {}

export const Vacancy: Model<IVacancyDocument>; 