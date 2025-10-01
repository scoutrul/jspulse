import type { VacancyDTO, IVacancyFindCriteria, IFindResult } from "@jspulse/shared";

/**
 * Чистый интерфейс репозитория вакансий в Domain Layer
 * Не содержит зависимостей от конкретных технологий
 */
export interface IVacancyRepository {
  // Основные CRUD операции
  create(data: Partial<VacancyDTO>): Promise<VacancyDTO>;
  findById(id: string): Promise<VacancyDTO | null>;
  updateById(id: string, data: Partial<VacancyDTO>): Promise<VacancyDTO | null>;
  deleteById(id: string): Promise<boolean>;

  // Поиск и фильтрация
  findMany(criteria: IVacancyFindCriteria): Promise<IFindResult<VacancyDTO>>;
  findWithFilters(criteria: IVacancyFindCriteria): Promise<IFindResult<VacancyDTO>>;
  findActiveVacancies(criteria: Omit<IVacancyFindCriteria, 'includeArchived'>): Promise<IFindResult<VacancyDTO>>;

  // Специализированные запросы
  findByExternalId(externalId: string, source: string): Promise<VacancyDTO | null>;
  findBySourceId(sourceId: string): Promise<VacancyDTO | null>;

  // Агрегация и статистика
  count(criteria?: Partial<VacancyDTO>): Promise<number>;
  getUniqueSkills(): Promise<string[]>;
  getUniqueSources(): Promise<string[]>;
  getStatistics(): Promise<{
    total: number;
    bySource: Record<string, number>;
    bySkills: Array<{ skill: string; count: number }>;
    salaryRanges: {
      average: number;
      median: number;
      min: number;
      max: number;
    };
  }>;

  // Массовые операции
  bulkCreate(vacancies: Partial<VacancyDTO>[]): Promise<{
    created: VacancyDTO[];
    duplicates: number;
    errors: Array<{ data: Partial<VacancyDTO>; error: string }>;
  }>;

  // Проверки
  isArchived(vacancyId: string): Promise<boolean>;
}
