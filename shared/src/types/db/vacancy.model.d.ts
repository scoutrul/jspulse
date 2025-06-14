import type { BaseVacancy } from "../core/vacancy.base.js";
/**
 * Интерфейс для обработанного контента описания вакансии
 */
export interface DescriptionContent {
    raw: string;
    preview: string;
    processed: string;
    textOnly: string;
}
/**
 * Интерфейс для документа вакансии в MongoDB.
 * Расширяет BaseVacancy и добавляет специфичные для БД поля.
 */
export interface IVacancy extends Omit<BaseVacancy, 'publishedAt'> {
    publishedAt: Date;
    description?: string;
    fullDescription?: string;
    processedHtml?: string;
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
