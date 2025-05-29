// События для слабой связанности модулей

import { IVacancy } from "../types/index.js";

// Упрощает добавление новых функций без изменения существующего кода
export interface VacancyEvents {
  'vacancy:created': { vacancy: IVacancy };
  'vacancy:updated': { vacancy: IVacancy };
}