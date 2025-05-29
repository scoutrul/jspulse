// События для слабой связанности модулей
// Упрощает добавление новых функций без изменения существующего кода
export interface VacancyEvents {
  'vacancy:created': { vacancy: IVacancy };
  'vacancy:updated': { vacancy: IVacancy };
}