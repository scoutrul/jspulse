/**
 * Базовый интерфейс для Repository Pattern.
 * Определяет стандартные CRUD операции для всех репозиториев в системе,
 * обеспечивая единообразный API и упрощая тестирование через мокирование.
 */
export interface IRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  /**
   * Создание новой записи.
   * Возвращает созданный объект с присвоенным ID.
   */
  create(data: TCreate): Promise<T>;

  /**
   * Поиск записи по уникальному идентификатору.
   * Возвращает null если запись не найдена.
   */
  findById(id: string): Promise<T | null>;

  /**
   * Поиск записей по критериям с поддержкой пагинации.
   * Возвращает результат с метаданными для UI компонентов.
   */
  findMany(criteria: IFindCriteria<T>): Promise<IFindResult<T>>;

  /**
   * Обновление записи по ID.
   * Возвращает обновленный объект или null если запись не найдена.
   */
  updateById(id: string, data: TUpdate): Promise<T | null>;

  /**
   * Удаление записи по ID.
   * Возвращает true если запись была удалена, false если не найдена.
   */
  deleteById(id: string): Promise<boolean>;

  /**
   * Подсчет записей по критериям.
   * Используется для пагинации без загрузки данных.
   */
  count(criteria?: Partial<T>): Promise<number>;
}

/**
 * Критерии для поиска записей с поддержкой пагинации и сортировки.
 * Обеспечивает типобезопасность и гибкость запросов.
 */
export interface IFindCriteria<T> {
  // Фильтры поиска (поддерживает частичное соответствие)
  where?: Partial<T>;

  // Параметры пагинации
  page?: number;
  limit?: number;

  // Сортировка по полям (объект с направлением сортировки)
  orderBy?: Record<keyof T, 'asc' | 'desc'>;

  // Поля для включения в результат (для оптимизации запросов)
  select?: (keyof T)[];
}

/**
 * Результат запроса со списком записей и метаданными.
 * Стандартизирует формат ответа для всех repository методов.
 */
export interface IFindResult<T> {
  // Найденные записи
  data: T[];

  // Метаданные для пагинации UI
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
} 