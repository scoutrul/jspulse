import { transformVacancies, extractSkillsFromVacancies } from "$lib/utils/vacancyTransformations.js";
import { createHttpClient } from "$lib/utils/http/index.js";
import type { HttpClient } from "$lib/utils/http/HttpClient";
import { logger } from "$lib/utils/logger.js";

import {
  VacancyListResponseSchema,
  SingleVacancyResponseSchema,
} from "@jspulse/shared/schemas/api.schema.js";
import type { VacancyDTO } from "@jspulse/shared";

/**
 * Опции для запроса вакансий
 */
export interface VacanciesOptions {
  limit?: number;
  page?: number;
  skills?: string[];
  includeArchived?: boolean;
  showUnvisited?: boolean; // Фильтр для показа только не просмотренных вакансий
  sources?: string[]; // Новое: фильтр по источникам
  shuffle?: boolean; // Включить перемешивание по источникам (по умолчанию true)
}

/**
 * Структура ответа с вакансиями
 */
export interface VacanciesResponse {
  vacancies: VacancyDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

/**
 * Структура ответа для одной вакансии с метаинформацией
 */
export interface SingleVacancyResponse {
  vacancy: VacancyDTO;
  isArchived: boolean;
}

/**
 * Класс для работы с API вакансий
 */
export class VacancyApi {
  private httpClient: HttpClient;
  private readonly CONTEXT = 'VacancyApi';

  /**
   * Создание экземпляра API вакансий
   */
  constructor(options?: { fetch?: typeof globalThis.fetch }) {
    this.httpClient = createHttpClient({
      fetch: options?.fetch
    });
  }

  /**
   * Получение списка вакансий с пагинацией и фильтрацией
   * По умолчанию показывает только активные вакансии (не архивные)
   */
  async fetchVacancies(options: VacanciesOptions = {}): Promise<VacanciesResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (options.limit) {
        queryParams.append('limit', options.limit.toString());
      }

      if (options.page !== undefined) {
        queryParams.append('page', options.page.toString());
      }

      if (options.skills && options.skills.length > 0) {
        queryParams.append('skills', options.skills.join(','));
      }

      // Добавляем параметр архивности (по умолчанию false)
      if (options.includeArchived) {
        queryParams.append('includeArchived', options.includeArchived.toString());
      }

      // Добавляем параметр фильтра "не просмотренные"
      if (options.showUnvisited) {
        queryParams.append('showUnvisited', options.showUnvisited.toString());
      }

      // Фильтр по источникам (comma-separated)
      if (options.sources && options.sources.length > 0) {
        queryParams.append('sources', options.sources.join(','));
      }

      // Параметр перемешивания (по умолчанию true)
      if (options.shuffle !== undefined) {
        queryParams.append('shuffle', options.shuffle.toString());
      }

      // Конструируем URL с параметрами пагинации и фильтрации
      const baseApiUrl = `/api/vacancies`;
      const url = baseApiUrl + (queryParams.toString() ? `?${queryParams.toString()}` : '');

      // Делаем запрос к API 
      const response = await this.httpClient.get(url);

      // Валидируем данные через схему
      const validationResult = VacancyListResponseSchema.safeParse(response);

      if (!validationResult.success) {
        logger.error(this.CONTEXT, 'Ошибка валидации данных API', validationResult.error);
        console.error('[VACANCY API] Полученные данные:', JSON.stringify(response, null, 2));
        console.error('[VACANCY API] Ошибки валидации:', JSON.stringify(validationResult.error.issues, null, 2));
        throw new Error('API вернуло данные в неожидаемом формате');
      }

      const validData = validationResult.data;

      // Трансформируем данные в нужный формат
      // @ts-ignore: salaryFrom и salaryTo преобразуются из null в undefined в функции transformVacancies
      const transformedVacancies = transformVacancies(validData.data) as VacancyDTO[];

      return {
        vacancies: transformedVacancies,
        total: validData.meta.totalItems,
        page: validData.meta.page,
        limit: validData.meta.limit,
        totalPages: validData.meta.totalPages,
      };
    } catch (error) {
      logger.error(this.CONTEXT, 'Ошибка при загрузке вакансий', error);
      throw error;
    }
  }

  /**
   * Получение списка навыков на основе существующих вакансий
   */
  async fetchSkills(): Promise<string[]> {
    try {
      logger.debug(this.CONTEXT, 'Запрос доступных навыков с сервера');

      const response = await this.httpClient.get('/api/vacancies/skills');

      // Проверяем типизированный ответ
      const typedResponse = response as { success?: boolean; data?: unknown };
      if (!typedResponse?.success || !Array.isArray(typedResponse.data)) {
        logger.error(this.CONTEXT, 'Некорректный формат данных навыков', response);
        return [];
      }

      return typedResponse.data as string[];
    } catch (error) {
      logger.error(this.CONTEXT, 'Ошибка при загрузке навыков', error);
      return [];
    }
  }

  /**
   * Получение статистики навыков с количеством вакансий
   */
  async fetchSkillsStats(): Promise<Array<{ skill: string; count: number }>> {
    try {
      logger.debug(this.CONTEXT, 'Запрос статистики навыков с сервера');

      const response = await this.httpClient.get('/api/vacancies/skills/stats');

      // Проверяем типизированный ответ
      const typedResponse = response as { success?: boolean; data?: unknown };
      if (!typedResponse?.success || !Array.isArray(typedResponse.data)) {
        logger.error(this.CONTEXT, 'Некорректный формат данных статистики навыков', response);
        return [];
      }

      // Преобразуем данные к нужному формату
      const rawData = typedResponse.data as Array<{ name: string; count: number }>;
      return rawData.map(item => ({
        skill: item.name, // API возвращает 'name', но мы ожидаем 'skill'
        count: item.count
      }));
    } catch (error) {
      logger.error(this.CONTEXT, 'Ошибка при загрузке статистики навыков', error);
      return [];
    }
  }

  /**
 * Получение одной вакансии по её ID
 * Возвращает вакансию независимо от того, архивная она или нет
 */
  async fetchVacancyById(id: string, sanitizeHtml?: (html: string) => string): Promise<SingleVacancyResponse | null> {
    try {
      const url = `/api/vacancies/${id}`;

      logger.debug(this.CONTEXT, `Запрос вакансии по ID: ${id}, URL: ${url}`);

      // Делаем запрос к API
      const response = await this.httpClient.get(url);

      logger.debug(this.CONTEXT, `Получен ответ для вакансии ${id}:`, response);

      // Валидируем данные через схему
      const validationResult = SingleVacancyResponseSchema.safeParse(response);

      if (!validationResult.success) {
        logger.error(this.CONTEXT, `Ошибка валидации данных вакансии ${id}:`, validationResult.error);
        logger.error(this.CONTEXT, `Полученные данные:`, response);
        // Fallback: сконструировать безопасный VacancyDTO, чтобы не рушить страницу
        const raw: any = response || {};
        const data: any = raw.data || raw;
        const htmlDescription: string =
          typeof data?.htmlDescription === 'string'
            ? data.htmlDescription
            : (data?.fullDescription?.raw || data?.fullDescription?.processed || data?.fullDescription?.textOnly || data?.description || '');

        const fallbackVacancy: VacancyDTO = {
          id: data?._id || data?.id || id,
          title: data?.title || 'Без названия',
          company: data?.company || 'Неизвестная компания',
          skills: Array.isArray(data?.skills) ? data.skills : [],
          salaryFrom: data?.salaryFrom ?? null,
          salaryTo: data?.salaryTo ?? null,
          salaryCurrency: data?.salaryCurrency || 'RUR',
          publishedAt: new Date(data?.publishedAt || Date.now()),
          source: data?.source || 'unknown',
          location: (data?.location && String(data.location)) || '—',
          description: data?.description || '',
          experience: data?.experience || 'Не указано',
          employment: data?.employment || 'Не указано',
          isActive: typeof data?.isActive === 'boolean' ? data.isActive : true,
          isHighSalary: typeof data?.isHighSalary === 'boolean' ? data.isHighSalary : false,
          isRemote: typeof data?.isRemote === 'boolean' ? data.isRemote : (/удаленн|remote/i.test(String(data?.location || ''))),
          isOffice: typeof data?.isOffice === 'boolean' ? data.isOffice : false,
          url: data?.url,
          htmlDescription,
          visited: typeof data?.visited === 'boolean' ? data.visited : false,
          hashtags: Array.isArray(data?.hashtags) ? data.hashtags : []
        } as VacancyDTO;

        return {
          vacancy: fallbackVacancy,
          isArchived: Boolean(raw?.meta?.isArchived) || false
        };
      }

      // Получаем валидированные данные
      const rawResponse = validationResult.data as { data: VacancyDTO; meta?: { isArchived?: boolean } };
      const vacancy = rawResponse.data;
      const isArchived = rawResponse.meta?.isArchived ?? false;

      logger.debug(this.CONTEXT, `Вакансия ${id} успешно загружена: ${vacancy.title} (архивная: ${isArchived})`);

      // Если есть HTML-описание и функция санитизации, применяем её
      if (vacancy.description && sanitizeHtml) {
        return {
          vacancy: {
            ...vacancy,
            description: sanitizeHtml(vacancy.description),
          } as VacancyDTO,
          isArchived
        };
      }

      return {
        vacancy,
        isArchived
      };
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка при загрузке вакансии ${id}`, error);
      return null;
    }
  }

  /**
   * Удаление вакансии по ID
   */
  async deleteVacancy(id: string): Promise<{ success: boolean; title?: string; error?: string }> {
    try {
      logger.debug(this.CONTEXT, `Удаление вакансии по ID: ${id}`);

      const response = await this.httpClient.delete(`/api/admin/vacancy/${id}`);

      // Проверяем успешность удаления
      if (response && typeof response === 'object' && 'success' in response) {
        const typedResponse = response as { success: boolean; title?: string; error?: string };
        if (typedResponse.success) {
          logger.debug(this.CONTEXT, `Вакансия ${id} успешно удалена`);
          return { success: true, title: typedResponse.title };
        } else {
          logger.error(this.CONTEXT, `Ошибка удаления вакансии ${id}:`, typedResponse.error);
          return { success: false, error: typedResponse.error || 'Ошибка удаления' };
        }
      }

      return { success: false, error: 'Неожиданный формат ответа' };
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка при удалении вакансии ${id}`, error);
      return { success: false, error: 'Ошибка сети или сервера' };
    }
  }

  /**
   * Отметка вакансии как посещенной
   */
  async markAsVisited(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.debug(this.CONTEXT, `Отметка вакансии ${id} как посещенной`);

      const response = await this.httpClient.patch(`/api/vacancies/${id}/visit`);

      if (response && typeof response === 'object' && 'success' in response) {
        const typedResponse = response as { success: boolean; error?: string };
        if (typedResponse.success) {
          logger.debug(this.CONTEXT, `Вакансия ${id} отмечена как посещенная`);
          return { success: true };
        } else {
          logger.error(this.CONTEXT, `Ошибка отметки вакансии ${id}:`, typedResponse.error);
          return { success: false, error: typedResponse.error || 'Ошибка отметки' };
        }
      }

      return { success: false, error: 'Неожиданный формат ответа' };
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка при отметке вакансии ${id} как посещенной`, error);
      return { success: false, error: 'Ошибка сети или сервера' };
    }
  }
}

// Создаем синглтон для использования в клиентском коде
export const vacancyApi = new VacancyApi();