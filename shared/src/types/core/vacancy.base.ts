/**
 * Базовый интерфейс вакансии, общие поля для всех источников.
 */
export interface BaseVacancy {
  externalId: string; // ID вакансии во внешней системе
  title: string; // Название вакансии
  company: string; // Название компании
  location: string; // Местоположение (город/страна)
  url: string; // Ссылка на оригинал вакансии
  publishedAt: string | Date; // Дата публикации (строка в ISO формате для DTO, Date для БД)
  source: string; // Источник вакансии (hh.ru, superjob, и т.д.)
} 