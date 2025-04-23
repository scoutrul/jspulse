/**
 * Базовый интерфейс вакансии, общие поля для всех источников.
 */
export interface BaseVacancy {
  externalId: string; // ID вакансии во внешней системе
  title: string; // Название вакансии
  company: string; // Название компании
  location: string; // Местоположение (город/страна)
  url: string; // Ссылка на оригинал вакансии
  publishedAt: Date; // Дата публикации (тип Date для удобства работы)
  source: string; // Источник вакансии (например, 'hh.ru', 'vc.ru')
}
