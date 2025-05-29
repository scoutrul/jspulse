import mongoose, { Schema, Document } from "mongoose";
import { IVacancy } from "@jspulse/shared";

export interface IVacancyDocument extends IVacancy, Document {
  externalId: string;
  title: string;
  company: string;
  location: string; // Remove ? to match IVacancy
  url: string;
  publishedAt: Date;
  source: string;
  description?: string;
  schedule?: string;
  skills: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  experience?: string;
  employment?: string;
  address?: string;
  rawData?: any;
}

const vacancySchema = new Schema<IVacancyDocument>(
  {
    externalId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String },
    url: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    source: { type: String, required: true },
    description: { type: String },
    schedule: { type: String },
    skills: [{ type: String }],
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

vacancySchema.index({ publishedAt: -1 });

export const Vacancy = mongoose.model<IVacancyDocument>("Vacancy", vacancySchema);
