// export * from './config/api.config'; <-- Удаляем или комментируем эту строку

// Экспортируем типы вакансий
export type { Vacancy, VacanciesResponse } from './types/vacancy.types';

// Экспортируем типы HH
export type { HHVacancy, HHResponse } from './types/hh.types';

// Можно добавить другие общие типы здесь

// Убираем все старые реэкспорты конфигов, клиентов, сервисов 