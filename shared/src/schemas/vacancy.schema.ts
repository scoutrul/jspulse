import { z } from "zod";
import { DateSchema, OptionalDateSchema } from "./date.schema.js";

/**
 * Базовая схема вакансии с общими полями для всех источников.
 */
export const BaseVacancySchema = z.object({
  externalId: z.string({
    required_error: "ID вакансии во внешней системе обязателен",
  }),
  title: z.string({
    required_error: "Название вакансии обязательно",
  }).min(1, "Название вакансии не может быть пустым"),
  company: z.string({
    required_error: "Название компании обязательно",
  }).min(1, "Название компании не может быть пустым"),
  location: z.string({
    required_error: "Местоположение обязательно",
  }).min(1, "Местоположение не может быть пустым"),
  url: z.string({
    required_error: "URL вакансии обязателен",
  }).url("Некорректный URL вакансии"),
  publishedAt: DateSchema,
  source: z.string({
    required_error: "Источник вакансии обязателен",
  }).min(1, "Источник вакансии не может быть пустым"),
});

/**
 * Схема DTO вакансии для передачи между бэкендом и фронтендом
 */
export const VacancyDTOSchema = BaseVacancySchema.extend({
  _id: z.string().optional(),
  description: z.string().optional(),
  fullDescription: z.string().optional(),       // JSON строка с полным описанием
  testFullDesc: z.string().optional(),          // Тестовое поле
  processedHtml: z.string().optional(),         // Кэшированный обработанный HTML
  schedule: z.string().optional(),
  skills: z.array(z.string()).default([]),
  salaryFrom: z.number().optional().nullable(),
  salaryTo: z.number().optional().nullable(),
  salaryCurrency: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  employment: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  htmlDescription: z.string().optional().nullable(),
  fullHtmlDescription: z.string().optional(),   // Полное HTML для frontend
});

/**
 * Схема для создания новой вакансии (без _id)
 */
export const CreateVacancySchema = VacancyDTOSchema.omit({ _id: true });

/**
 * Схема для обновления существующей вакансии (все поля опциональны)
 */
export const UpdateVacancySchema = VacancyDTOSchema.partial();

/**
 * Схема для поиска вакансий
 */
export const VacancySearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sortBy: z.enum(["relevance", "date", "salary"]).default("relevance"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type BaseVacancy = z.infer<typeof BaseVacancySchema>;
export type VacancyDTO = Omit<z.infer<typeof BaseVacancySchema>, 'publishedAt'> & {
  _id?: string;
  description?: string;
  fullDescription?: string;        // JSON строка с полным описанием
  testFullDesc?: string;           // Тестовое поле
  processedHtml?: string;          // Кэшированный обработанный HTML
  schedule?: string;
  skills: string[];
  salaryFrom?: number | null;
  salaryTo?: number | null;
  salaryCurrency?: string | null;
  experience?: string | null;
  employment?: string | null;
  address?: string | null;
  htmlDescription?: string | null;
  fullHtmlDescription?: string;    // Полное HTML для frontend
  publishedAt: Date;
};
export type CreateVacancy = z.infer<typeof CreateVacancySchema>;
export type UpdateVacancy = z.infer<typeof UpdateVacancySchema>;
export type VacancySearch = z.infer<typeof VacancySearchSchema>; 