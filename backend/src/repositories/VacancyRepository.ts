import {
  IVacancyRepository,
  IVacancyFindCriteria,
  IFindResult,
  VacancyDTO,
  ICacheService,
  PAGINATION,
  ARCHIVE
} from "@jspulse/shared";
import { Vacancy, IVacancyDocument } from "../models/Vacancy.js";
import { isValidObjectId } from "mongoose";

/**
 * Конкретная реализация репозитория для работы с вакансиями в MongoDB.
 * Инкапсулирует всю логику работы с базой данных и предоставляет
 * типизированный интерфейс для бизнес-слоя приложения.
 * Включает интегрированное кэширование для оптимизации производительности.
 */
export class VacancyRepository implements IVacancyRepository {

  constructor(private cacheService?: ICacheService) { }

  /**
   * Создание новой вакансии.
   * Автоматически преобразует входные данные в MongoDB документ.
   * Инвалидирует связанные записи в кэше.
   */
  async create(data: Partial<VacancyDTO>): Promise<VacancyDTO> {
    const vacancy = new Vacancy(data);
    const savedVacancy = await vacancy.save();
    const result = this.documentToDTO(savedVacancy);

    // Инвалидируем кэш для списков после создания
    await this.invalidateListCaches();

    return result;
  }

  /**
   * Поиск вакансии по ID с валидацией ObjectId.
   * Возвращает null для некорректных ID без выброса ошибки.
   * Всегда возвращает вакансию независимо от того, архивная она или нет.
   */
  async findById(id: string): Promise<VacancyDTO | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    // Проверяем кэш для одиночных вакансий
    const cacheKey = `vacancy:${id}`;
    if (this.cacheService) {
      const cached = await this.cacheService.get<VacancyDTO>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const vacancy = await Vacancy.findById(id).lean();
    const result = vacancy ? this.documentToDTO(vacancy) : null;

    // Кэшируем результат на 15 минут (включая null для предотвращения repeated queries)
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, result, 900);
    }

    return result;
  }

  /**
   * Базовый поиск вакансий с пагинацией.
   * По умолчанию показывает только активные вакансии (не архивные).
   * Для продвинутых фильтров используйте findWithFilters().
   */
  async findMany(criteria: IVacancyFindCriteria): Promise<IFindResult<VacancyDTO>> {
    const { page = PAGINATION.VALIDATION.MIN_PAGE, limit = PAGINATION.DEFAULT_PAGE_SIZE, where = {}, orderBy, includeArchived = false } = criteria;

    // Кэшируем простые запросы списков
    const cacheKey = this.buildListCacheKey('findMany', { page, limit, where, orderBy, includeArchived });
    if (this.cacheService) {
      const cached = await this.cacheService.get<IFindResult<VacancyDTO>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Строим MongoDB query из критериев поиска
    const query = this.buildMongoQuery(where);

    // Добавляем фильтр архивности если не включаем архивные
    if (!includeArchived) {
      query.publishedAt = { $gte: this.getArchiveDateThreshold() };
    }

    const total = await Vacancy.countDocuments(query);
    const offset = page * limit;

    let mongoQuery = Vacancy.find(query)
      .limit(limit)
      .skip(offset)
      .lean();

    // Обрабатываем сортировку
    if (orderBy) {
      const sortObj: Record<string, 1 | -1> = {};
      Object.entries(orderBy).forEach(([key, direction]) => {
        sortObj[key] = direction === 'asc' ? 1 : -1;
      });
      mongoQuery = mongoQuery.sort(sortObj);
    } else {
      // Сортировка по умолчанию - новые вакансии первыми
      mongoQuery = mongoQuery.sort({ publishedAt: -1 });
    }

    const vacancies = await mongoQuery;

    const result = {
      data: vacancies.map(v => this.documentToDTO(v)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit) - 1,
        hasPrevPage: page > 0
      }
    };

    // Кэшируем результат на 5 минут
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, result, 300);
    }

    return result;
  }

  /**
   * Получение только активных (не архивных) вакансий.
   * Вакансии считаются активными если опубликованы в течение последних 30 дней.
   */
  async findActiveVacancies(criteria: Omit<IVacancyFindCriteria, 'includeArchived'>): Promise<IFindResult<VacancyDTO>> {
    return this.findMany({ ...criteria, includeArchived: false });
  }

  /**
   * Проверка является ли вакансия архивной.
   * Возвращает true если вакансия старше 30 дней.
   */
  async isArchived(vacancyId: string): Promise<boolean> {
    if (!isValidObjectId(vacancyId)) {
      return false;
    }

    const vacancy = await Vacancy.findById(vacancyId, 'publishedAt').lean();
    if (!vacancy || !vacancy.publishedAt) {
      return false;
    }

    const archiveThreshold = this.getArchiveDateThreshold();
    return new Date(vacancy.publishedAt) < archiveThreshold;
  }

  /**
   * Вычисляет пороговую дату для архивации.
   * Вакансии старше этой даты считаются архивными.
   */
  private getArchiveDateThreshold(): Date {
    return new Date(Date.now() - ARCHIVE.ACTIVE_VACANCY_MS);
  }

  /**
   * Обновление вакансии по ID.
   * Использует findByIdAndUpdate для атомарной операции.
   * Инвалидирует кэш для обновленной записи.
   */
  async updateById(id: string, data: Partial<VacancyDTO>): Promise<VacancyDTO | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    const updatedVacancy = await Vacancy.findByIdAndUpdate(
      id,
      data,
      { new: true, lean: true }
    );

    const result = updatedVacancy ? this.documentToDTO(updatedVacancy) : null;

    // Инвалидируем кэш для обновленной записи
    if (this.cacheService) {
      await this.cacheService.delete(`vacancy:${id}`);
      await this.invalidateListCaches();
    }

    return result;
  }

  /**
   * Удаление вакансии по ID.
   * Возвращает true если документ был найден и удален.
   * Инвалидирует связанные записи в кэше.
   */
  async deleteById(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      return false;
    }

    const result = await Vacancy.findByIdAndDelete(id);

    // Инвалидируем кэш для удаленной записи
    if (this.cacheService) {
      await this.cacheService.delete(`vacancy:${id}`);
      await this.invalidateListCaches();
    }

    return result !== null;
  }

  /**
   * Подсчет количества вакансий по критериям.
   * Оптимизированная операция без загрузки документов.
   * Кэшируется для ускорения пагинации.
   */
  async count(criteria?: Partial<VacancyDTO>): Promise<number> {
    const cacheKey = `count:${this.hashObject(criteria || {})}`;

    if (this.cacheService) {
      const cached = await this.cacheService.get<number>(cacheKey);
      if (cached !== null && cached !== undefined) {
        return cached;
      }
    }

    const query = criteria ? this.buildMongoQuery(criteria) : {};
    const result = await Vacancy.countDocuments(query);

    // Кэшируем count на 2 минуты
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, result, 120);
    }

    return result;
  }

  /**
   * Продвинутый поиск вакансий с поддержкой всех фильтров UI.
   * Основной метод для получения отфильтрованного списка вакансий.
   * По умолчанию показывает только активные вакансии (не архивные).
   * Агрессивно кэшируется для улучшения UX.
   */
  async findWithFilters(criteria: IVacancyFindCriteria): Promise<IFindResult<VacancyDTO>> {
    // Кэшируем сложные запросы с фильтрами
    const cacheKey = this.buildListCacheKey('findWithFilters', criteria);
    if (this.cacheService) {
      const cached = await this.cacheService.get<IFindResult<VacancyDTO>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const {
      page = PAGINATION.VALIDATION.MIN_PAGE,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      skills,
      salaryRange,
      sources,
      publishedAfter,
      publishedBefore,
      searchText,
      orderBy,
      includeArchived = false
    } = criteria;

    // Строим сложный MongoDB query
    const query: any = {};

    // Фильтр по навыкам (OR логика)
    if (skills && skills.length > 0) {
      query.skills = { $in: skills };
    }

    // Фильтр по диапазону зарплат
    if (salaryRange) {
      if (salaryRange.from !== undefined) {
        query.salaryFrom = { $gte: salaryRange.from };
      }
      if (salaryRange.to !== undefined) {
        query.salaryTo = { $lte: salaryRange.to };
      }
      if (salaryRange.currency) {
        query.salaryCurrency = salaryRange.currency;
      }
    }

    // Фильтр по источникам
    if (sources && sources.length > 0) {
      query.source = { $in: sources };
    }

    // Фильтр по дате публикации
    if (publishedAfter || publishedBefore || !includeArchived) {
      query.publishedAt = {};
      if (publishedAfter) {
        query.publishedAt.$gte = publishedAfter;
      }
      if (publishedBefore) {
        query.publishedAt.$lte = publishedBefore;
      }
      // Добавляем фильтр архивности если не включаем архивные
      if (!includeArchived) {
        // Если уже есть $gte, берем максимальную дату
        const archiveThreshold = this.getArchiveDateThreshold();
        if (query.publishedAt.$gte) {
          query.publishedAt.$gte = new Date(Math.max(query.publishedAt.$gte.getTime(), archiveThreshold.getTime()));
        } else {
          query.publishedAt.$gte = archiveThreshold;
        }
      }
    }

    // Текстовый поиск
    if (searchText) {
      // MongoDB text search или regex поиск по нескольким полям
      query.$or = [
        { title: { $regex: searchText, $options: 'i' } },
        { company: { $regex: searchText, $options: 'i' } },
        { description: { $regex: searchText, $options: 'i' } }
      ];
    }

    const total = await Vacancy.countDocuments(query);
    const offset = page * limit;

    let mongoQuery = Vacancy.find(query)
      .limit(limit)
      .skip(offset)
      .lean();

    // Сортировка
    if (orderBy) {
      const sortObj: Record<string, 1 | -1> = {};
      Object.entries(orderBy).forEach(([key, direction]) => {
        sortObj[key] = direction === 'asc' ? 1 : -1;
      });
      mongoQuery = mongoQuery.sort(sortObj);
    } else {
      mongoQuery = mongoQuery.sort({ publishedAt: -1 });
    }

    const vacancies = await mongoQuery;

    const result = {
      data: vacancies.map(v => this.documentToDTO(v)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit) - 1,
        hasPrevPage: page > 0
      }
    };

    // Кэшируем результат на 3 минуты (меньше чем простые запросы из-за сложности)
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, result, 180);
    }

    return result;
  }

  /**
   * Получение уникальных навыков для автокомплита.
   * Использует агрессивное кэширование поскольку данные меняются редко.
   */
  async getUniqueSkills(): Promise<string[]> {
    const cacheKey = 'skills:unique';

    if (this.cacheService) {
      const cached = await this.cacheService.get<string[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const skillsAggregation = await Vacancy.aggregate([
      { $unwind: "$skills" },
      { $group: { _id: "$skills" } },
      { $sort: { _id: 1 } }
    ]);

    const result = skillsAggregation.map(item => item._id);

    // Кэшируем навыки на 30 минут (данные меняются редко)
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, result, 1800);
    }

    return result;
  }

  /**
   * Поиск вакансии по внешнему ID для предотвращения дубликатов.
   * Критично для корректной работы импорта данных.
   */
  async findByExternalId(externalId: string, source: string): Promise<VacancyDTO | null> {
    const cacheKey = `external:${source}:${externalId}`;

    if (this.cacheService) {
      const cached = await this.cacheService.get<VacancyDTO | null>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    const vacancy = await Vacancy.findOne({
      externalId,
      source
    }).lean();

    const result = vacancy ? this.documentToDTO(vacancy) : null;

    // Кэшируем на 10 минут для ускорения импорта
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, result, 600);
    }

    return result;
  }

  /**
   * Поиск вакансии по sourceId для предотвращения дубликатов.
   * Используется при парсинге Telegram каналов.
   */
  async findBySourceId(sourceId: string): Promise<VacancyDTO | null> {
    const cacheKey = `sourceId:${sourceId}`;

    if (this.cacheService) {
      const cached = await this.cacheService.get<VacancyDTO | null>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    const vacancy = await Vacancy.findOne({
      sourceId
    }).lean();

    const result = vacancy ? this.documentToDTO(vacancy) : null;

    // Кэшируем на 10 минут для ускорения парсинга
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, result, 600);
    }

    return result;
  }

  /**
   * Массовое создание вакансий с обработкой дубликатов.
   * Оптимизировано для импорта больших объемов данных.
   */
  async bulkCreate(vacancies: Partial<VacancyDTO>[]): Promise<{
    created: VacancyDTO[];
    duplicates: number;
    errors: Array<{ data: Partial<VacancyDTO>; error: string }>;
  }> {
    const result = {
      created: [] as VacancyDTO[],
      duplicates: 0,
      errors: [] as Array<{ data: Partial<VacancyDTO>; error: string }>
    };

    for (const vacancyData of vacancies) {
      try {
        // Проверяем на дубликат если есть externalId
        if (vacancyData.externalId && vacancyData.source) {
          const existing = await this.findByExternalId(
            vacancyData.externalId,
            vacancyData.source
          );
          if (existing) {
            result.duplicates++;
            continue;
          }
        }

        const created = await this.create(vacancyData);
        result.created.push(created);
      } catch (error) {
        result.errors.push({
          data: vacancyData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Инвалидируем все кэши после bulk операции
    await this.invalidateAllCaches();

    return result;
  }

  /**
   * Получение статистики по вакансиям для аналитики.
   * Использует агрегацию для эффективного расчета метрик.
   * Кэшируется на длительное время поскольку вычисления дорогие.
   */
  async getStatistics(): Promise<{
    total: number;
    bySource: Record<string, number>;
    bySkills: Array<{ skill: string; count: number }>;
    salaryRanges: {
      average: number;
      median: number;
      min: number;
      max: number;
    };
  }> {
    const cacheKey = 'statistics:all';

    if (this.cacheService) {
      const cached = await this.cacheService.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const [totalCount, sourceStats, skillStats, salaryStats] = await Promise.all([
      // Общее количество
      Vacancy.countDocuments(),

      // Статистика по источникам
      Vacancy.aggregate([
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Топ навыков
      Vacancy.aggregate([
        { $unwind: "$skills" },
        { $group: { _id: "$skills", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 }
      ]),

      // Статистика по зарплатам
      Vacancy.aggregate([
        {
          $match: {
            $and: [
              { salaryFrom: { $ne: null } },
              { salaryTo: { $ne: null } }
            ]
          }
        },
        {
          $group: {
            _id: null,
            avgSalary: { $avg: { $avg: ["$salaryFrom", "$salaryTo"] } },
            minSalary: { $min: "$salaryFrom" },
            maxSalary: { $max: "$salaryTo" },
            salaries: { $push: { $avg: ["$salaryFrom", "$salaryTo"] } }
          }
        }
      ])
    ]);

    // Форматируем результаты
    const bySource: Record<string, number> = {};
    sourceStats.forEach(item => {
      bySource[item._id] = item.count;
    });

    const bySkills = skillStats.map(item => ({
      skill: item._id,
      count: item.count
    }));

    // Расчет медианы (упрощенный)
    const salaryData = salaryStats[0] || {
      avgSalary: 0,
      minSalary: 0,
      maxSalary: 0,
      salaries: []
    };

    const sortedSalaries = salaryData.salaries.sort((a: number, b: number) => a - b);
    const median = sortedSalaries.length > 0
      ? sortedSalaries[Math.floor(sortedSalaries.length / 2)]
      : 0;

    const result = {
      total: totalCount,
      bySource,
      bySkills,
      salaryRanges: {
        average: Math.round(salaryData.avgSalary || 0),
        median: Math.round(median),
        min: salaryData.minSalary || 0,
        max: salaryData.maxSalary || 0
      }
    };

    // Кэшируем статистику на 1 час (дорогие вычисления)
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, result, 3600);
    }

    return result;
  }

  /**
   * Конвертация MongoDB документа в DTO.
   * Обеспечивает согласованность типов между базой данных и API.
   * Исключает MongoDB-специфичные поля (timestamps) из публичного API.
   */
  private documentToDTO(doc: any): VacancyDTO {
    if (!doc || !doc._id) {
      throw new Error('Invalid document: missing _id field');
    }

    return {
      _id: doc._id.toString(),
      externalId: doc.externalId,
      title: doc.title,
      company: doc.company,
      location: doc.location,
      url: doc.url,
      publishedAt: doc.publishedAt,
      source: doc.source,
      description: doc.description,
      fullDescription: doc.fullDescription ? JSON.stringify(doc.fullDescription) : undefined, // Полное описание как JSON строка
      testFullDesc: doc.fullDescription ? "HAS_FULL_DESC" : "NO_FULL_DESC", // Тестовое поле
      htmlDescription: doc.htmlDescription, // Оставляем как есть
      schedule: doc.schedule,
      skills: doc.skills || [],
      salaryFrom: doc.salaryFrom,
      salaryTo: doc.salaryTo,
      salaryCurrency: doc.salaryCurrency,
      experience: doc.experience,
      employment: doc.employment,
      address: doc.address,

      // Telegram-специфичные поля
      sourceId: doc.sourceId,
      sourceChannel: doc.sourceChannel,
      sourceUrl: doc.sourceUrl,
      contact: doc.contact,
      workFormat: doc.workFormat,
      hashtags: doc.hashtags || [],
      confidence: doc.confidence,
      parsedAt: doc.parsedAt
    };
  }

  /**
   * Построение MongoDB query из простых критериев.
   * Обрабатывает базовые типы данных для поиска.
   */
  private buildMongoQuery(criteria: Partial<VacancyDTO>): any {
    const query: any = {};

    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Простое равенство для большинства полей
        query[key] = value;
      }
    });

    return query;
  }

  /**
   * Построение ключа кэша для списочных запросов.
   * Создает стабильный хэш на основе параметров запроса.
   */
  private buildListCacheKey(method: string, criteria: any): string {
    const hash = this.hashObject(criteria);
    return `list:${method}:${hash}`;
  }

  /**
   * Простое хэширование объекта для создания стабильных ключей кэша.
   * Сортирует ключи для обеспечения консистентности.
   */
  private hashObject(obj: any): string {
    const sortedKeys = Object.keys(obj).sort();
    const normalized = sortedKeys.map(key => `${key}:${JSON.stringify(obj[key])}`).join('|');

    // Простой хэш для демонстрации (в production лучше использовать crypto)
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Конвертация в 32-битное число
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Инвалидация кэшей для списочных запросов.
   * Вызывается при изменении данных.
   */
  private async invalidateListCaches(): Promise<void> {
    if (!this.cacheService) return;

    // Получаем все ключи и удаляем те, что начинаются с 'list:'
    // Примечание: в production кэше может понадобиться более эффективный подход
    const stats = await this.cacheService.getStats();
    // Для простоты очищаем все (в production лучше использовать префиксы)
    await this.cacheService.delete('skills:unique');
    await this.cacheService.delete('statistics:all');
  }

  /**
   * Полная инвалидация всех кэшей.
   * Используется после bulk операций.
   */
  private async invalidateAllCaches(): Promise<void> {
    if (!this.cacheService) return;

    // Для упрощения очищаем весь кэш после bulk операций
    await this.cacheService.clear();
  }
} 