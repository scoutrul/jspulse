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

      // Конструируем URL с параметрами пагинации и фильтрации
      const baseApiUrl = `/api/vacancies`;
      const url = baseApiUrl + (queryParams.toString() ? `?${queryParams.toString()}` : '');

      // Делаем запрос к API 
      const response = await this.httpClient.get(url);

      // Валидируем данные через схему
      const validationResult = VacancyListResponseSchema.safeParse(response);

      if (!validationResult.success) {
        logger.error(this.CONTEXT, 'Ошибка валидации данных API', validationResult.error);
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
      const rawData = typedResponse.data as Array<{ skill: string; count: number }>;
      return rawData.map(item => ({
        skill: item.skill,
        count: item.count
      }));
    } catch (error) {
      logger.error(this.CONTEXT, 'Ошибка при загрузке статистики навыков', error);
      return [];
    }
  }

  /**
 * Получение одной вакансии по её ID
 */
  async fetchVacancyById(id: string, sanitizeHtml?: (html: string) => string): Promise<VacancyDTO | null> {
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
        return null;
      }

      // Получаем валидированные данные
      const vacancy = validationResult.data.data as unknown as VacancyDTO;

      logger.debug(this.CONTEXT, `Вакансия ${id} успешно загружена:`, vacancy.title);

      // Если есть HTML-описание и функция санитизации, применяем её
      if (vacancy.description && sanitizeHtml) {
        return {
          ...vacancy,
          description: sanitizeHtml(vacancy.description),
        } as VacancyDTO;
      }

      return vacancy;
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка при загрузке вакансии ${id}`, error);
      return null;
    }
  }
}

// Создаем синглтон для использования в клиентском коде
export const vacancyApi = new VacancyApi();