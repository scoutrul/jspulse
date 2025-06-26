import type { IRepository, IFindCriteria, IFindResult } from './repository.interface.js';
import type { VacancyDTO } from '../dto/vacancy.dto.js';

/**
 * Критерии поиска вакансий с дополнительными фильтрами.
 * Расширяет базовые критерии специфичными для вакансий параметрами
 * для поддержки продвинутой фильтрации на UI.
 */
export interface IVacancyFindCriteria extends IFindCriteria<VacancyDTO> {
  // Фильтр по навыкам (поиск вакансий содержащих любой из указанных навыков)
  skills?: string[];

  // Фильтр по диапазону зарплат
  salaryRange?: {
    from?: number;
    to?: number;
    currency?: string;
  };

  // Фильтр по источнику данных (hh.ru, habr.career и т.д.)
  sources?: string[];

  // Фильтр по дате публикации
  publishedAfter?: Date;
  publishedBefore?: Date;

  // Текстовый поиск по названию, описанию и компании
  searchText?: string;

  // Включать ли архивные вакансии в результаты поиска
  includeArchived?: boolean;
}

/**
 * Специализированный репозиторий для работы с вакансиями.
 * Добавляет доменно-специфичные методы к базовому CRUD функционалу
 * для поддержки особенностей работы с вакансиями в приложении.
 */
export interface IVacancyRepository extends IRepository<VacancyDTO> {
  /**
   * Поиск вакансий с продвинутыми фильтрами.
   * Основной метод для UI списка вакансий с поддержкой всех фильтров.
   */
  findWithFilters(criteria: IVacancyFindCriteria): Promise<IFindResult<VacancyDTO>>;

  /**
   * Получение уникальных навыков из всех вакансий.
   * Используется для автокомплита в фильтрах UI.
   */
  getUniqueSkills(): Promise<string[]>;

  /**
   * Поиск вакансии по внешнему ID для предотвращения дубликатов.
   * Используется при импорте данных из внешних источников.
   */
  findByExternalId(externalId: string, source: string): Promise<VacancyDTO | null>;

  /**
   * Поиск вакансии по sourceId для предотвращения дубликатов.
   * Используется при парсинге Telegram каналов.
   */
  findBySourceId(sourceId: string): Promise<VacancyDTO | null>;

  /**
   * Массовое создание вакансий с проверкой на дубликаты.
   * Оптимизированный метод для импорта больших объемов данных.
   */
  bulkCreate(vacancies: Partial<VacancyDTO>[]): Promise<{
    created: VacancyDTO[];
    duplicates: number;
    errors: Array<{ data: Partial<VacancyDTO>; error: string }>;
  }>;

  /**
   * Получение статистики по вакансиям.
   * Возвращает агрегированные данные для дашборда и аналитики.
   */
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

  /**
   * Получение только активных (не архивных) вакансий.
   * Вакансии считаются активными если опубликованы в течение последних 30 дней.
   */
  findActiveVacancies(criteria: Omit<IVacancyFindCriteria, 'includeArchived'>): Promise<IFindResult<VacancyDTO>>;

  /**
   * Проверка является ли вакансия архивной.
   * Возвращает true если вакансия старше 30 дней.
   */
  isArchived(vacancyId: string): Promise<boolean>;
} 