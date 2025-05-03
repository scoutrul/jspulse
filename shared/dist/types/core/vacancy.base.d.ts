/**
 * Базовый интерфейс вакансии, общие поля для всех источников.
 */
export interface BaseVacancy {
    externalId?: string;
    title: string;
    company: string;
    location?: string;
    url: string;
    publishedAt: Date;
}
