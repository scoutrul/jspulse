/**
 * Базовый интерфейс вакансии, общие поля для всех источников.
 */
export interface BaseVacancy {
  externalId: string; // ID вакансии во внешней системе // <--- Вот это поле
  title: string; // Название вакансии
  company: string; // Название компании
  location: string; // Местоположение (город/страна)
  url: string; // Ссылка на оригинал вакансии
  publishedAt: Date; // Исправляем тип на Date
}
