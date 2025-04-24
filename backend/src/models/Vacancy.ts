import mongoose, { Schema, Document } from 'mongoose';
import type { IVacancy } from '@jspulse/shared';

export interface IVacancyDocument extends IVacancy, Document {
  externalId: string;
}

const vacancySchema = new Schema<IVacancyDocument>({
  externalId: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  url: { type: String, required: true },
  publishedAt: { type: Date, required: true, index: true },
  source: { type: String, required: true, index: true },
  description: { type: String },
  schedule: { type: String },
  skills: [{ type: String, index: true }],
  salaryFrom: { type: Number },
  salaryTo: { type: Number },
  salaryCurrency: { type: String },
  experience: { type: String },
  employment: { type: String },
  address: { type: String },
  rawData: { type: mongoose.Schema.Types.Mixed, },
}, {
  timestamps: true,
  versionKey: false
});

export const Vacancy = mongoose.model<IVacancyDocument>('Vacancy', vacancySchema);
