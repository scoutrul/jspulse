/**
 * Базовый интерфейс вакансии, общие поля для всех источников.
 */
export interface BaseVacancy {
  externalId?: string; // ID вакансии во внешней системе
  title: string; // Название вакансии
  company: string; // Название компании
  location?: string; // Местоположение (город/страна) - Делаем опциональным
  url: string; // Ссылка на оригинал вакансии
  publishedAt: Date; // Исправляем тип на Date
}

/**
 * Источники вакансий
 */
export enum VacancySource {
  HH = "HH.ru",
  // TODO: Добавить другие источники по мере необходимости
}
