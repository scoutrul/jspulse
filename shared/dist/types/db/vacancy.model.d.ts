import type { BaseVacancy } from "../core/vacancy.base.js";
/**
 * Интерфейс для документа вакансии в MongoDB.
 * Расширяет BaseVacancy и добавляет специфичные для БД поля.
 */
export interface IVacancy extends BaseVacancy {
    externalId?: string;
    source: string;
    description?: string;
    schedule?: string;
    skills?: string[];
    salaryFrom?: number;
    salaryTo?: number;
    salaryCurrency?: string;
    experience?: string;
    employment?: string;
    address?: string;
    rawData?: any;
}
