import type { VacancyDTO } from './vacancy.dto.js';

/**
 * DTO для ответа API со списком вакансий и общим количеством.
 */
export interface VacanciesResponseDTO {
  /** Список вакансий для текущей страницы/фильтра */
  vacancies: VacancyDTO[];
  /** Общее количество вакансий, соответствующих фильтру */
  totalCount: number;
} 