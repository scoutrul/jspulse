import type { BaseVacancy } from "../core/vacancy.base.js";
export interface VacancyDTO extends BaseVacancy {
    _id: string;
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
    publishedAt: Date;
}
