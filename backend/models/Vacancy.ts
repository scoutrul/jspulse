import mongoose, { Schema, Document, Model } from "mongoose";
import type { IVacancy } from "@jspulse/shared";

export interface IVacancyDocument extends IVacancy, Document {}

export type VacancyModelType = Model<IVacancyDocument>;

const vacancySchema = new Schema<IVacancyDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    externalId: {
      type: String,
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    schedule: {
      type: String,
    },
    salaryFrom: {
      type: Number,
    },
    salaryTo: {
      type: Number,
    },
    salaryCurrency: {
      type: String,
    },
    url: {
      type: String,
      required: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    experience: {
      type: String,
    },
    employment: {
      type: String,
    },
    address: {
      type: String,
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

vacancySchema.index({ externalId: 1, source: 1 }, { unique: true });

export const Vacancy = mongoose.model<IVacancyDocument, VacancyModelType>("Vacancy", vacancySchema);
