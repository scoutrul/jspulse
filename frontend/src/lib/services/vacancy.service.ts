import type {
  VacancyDTO,
  VacancyWithHtml
} from "@jspulse/shared";
import { vacancyApi, type VacanciesOptions } from "$lib/api/vacancy.api";
import { logger } from "$lib/utils/logger.js";

// Константа для контекста логирования
const CONTEXT = 'VacancyService';

// Тип для результата запроса клиента на фронтенде
export interface VacanciesClientResponse {
  vacancies: VacancyWithHtml[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

/**
 * Сервис-обертка для работы с вакансиями на клиентской стороне.
 * Инкапсулирует логику обработки ошибок и преобразования данных
 * между API-слоем и компонентами UI, обеспечивая единообразный интерфейс.
 */
export class VacancyService {
  // Минимальная инициализация без дополнительной конфигурации,
  // поскольку вся сложная логика делегируется в vacancyApi
  constructor() {
    logger.debug(CONTEXT, 'Инициализация VacancyService');
  }

  /**
   * Получение навыков для автокомплита в фильтрах.
   * Возвращает пустой массив при ошибках, чтобы не блокировать UI.
   */
  async fetchSkillsClient(): Promise<string[]> {
    try {
      logger.debug(CONTEXT, 'Запрос доступных навыков');
      return await vacancyApi.fetchSkills();
    } catch (error) {
      // Навыки не критичны для функционирования приложения,
      // поэтому возвращаем пустой массив вместо выброса ошибки
      logger.error(CONTEXT, 'Ошибка при получении навыков', error);
      return [];
    }
  }

  /**
   * Получение статистики навыков с количеством вакансий.
   * Используется для визуализации в пузырьковой диаграмме.
   */
  async fetchSkillsStatsClient(): Promise<Array<{ skill: string; count: number }>> {
    try {
      logger.debug(CONTEXT, 'Запрос статистики навыков');
      return await vacancyApi.fetchSkillsStats();
    } catch (error) {
      logger.error(CONTEXT, 'Ошибка при получении статистики навыков', error);
      return [];
    }
  }

  /**
   * Получение детальной информации о вакансии для страницы просмотра.
   * Возвращает null при ошибках, чтобы компонент мог показать fallback.
   */
  async fetchVacancyByIdClient(
    id: string
  ): Promise<VacancyDTO | null> {
    try {
      logger.debug(CONTEXT, `Запрос вакансии с ID: ${id}`);
      const result = await vacancyApi.fetchVacancyById(id);
      return result?.vacancy || null;
    } catch (error) {
      // Возвращаем null для индикации отсутствия данных
      // вместо выброса ошибки, чтобы позволить UI показать 404
      logger.error(CONTEXT, `Ошибка при получении вакансии ${id}`, error);
      return null;
    }
  }

  /**
   * Основной метод для получения списка вакансий с пагинацией и фильтрацией.
   * Всегда возвращает валидную структуру ответа, даже при ошибках,
   * чтобы обеспечить стабильную работу UI-компонентов.
   */
  async fetchVacanciesClient(params: VacanciesOptions): Promise<VacanciesClientResponse> {
    try {
      logger.debug(CONTEXT, 'Запрос списка вакансий', { params });

      const result = await vacancyApi.fetchVacancies({
        page: params.page,
        limit: params.limit,
        skills: params.skills,
        showUnvisited: params.showUnvisited
      });

      // Приведение типов необходимо, поскольку API может возвращать
      // различные варианты VacancyDTO в зависимости от контекста
      return {
        vacancies: result.vacancies as VacancyWithHtml[],
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Неизвестная ошибка при загрузке вакансий';

      logger.error(CONTEXT, 'Ошибка при получении вакансий', error);

      // Возвращаем структуру с пустыми данными и сообщением об ошибке
      // для graceful degradation UI без блокировки интерфейса
      return {
        vacancies: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Прямой переход к конкретной странице (для новой пагинации).
   * Метод оптимизирован для быстрого перехода без лишних операций.
   */
  async fetchPageDirectly(params: {
    page: number;
    limit: number;
    skills?: string[];
  }): Promise<VacanciesClientResponse> {
    try {
      logger.debug(CONTEXT, 'Прямой переход к странице', { params });

      const result = await vacancyApi.fetchVacancies({
        page: params.page,
        limit: params.limit,
        skills: params.skills || [],
        showUnvisited: params.showUnvisited
      });

      return {
        vacancies: result.vacancies as VacancyWithHtml[],
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Ошибка при переходе к странице';

      logger.error(CONTEXT, 'Ошибка при прямом переходе к странице', error);

      return {
        vacancies: [],
        total: 0,
        page: params.page,
        limit: params.limit,
        totalPages: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Предзагрузка соседних страниц для улучшения UX.
   * Запускается в фоне без блокировки UI.
   */
  async preloadAdjacentPages(currentPage: number, totalPages: number, params: {
    limit: number;
    skills?: string[];
  }): Promise<void> {
    try {
      logger.debug(CONTEXT, 'Предзагрузка соседних страниц', { currentPage, totalPages });

      const promises: Promise<any>[] = [];

      // Предзагружаем предыдущую страницу
      if (currentPage > 0) {
        promises.push(this.fetchPageDirectly({
          page: currentPage - 1,
          limit: params.limit,
          skills: params.skills
        }));
      }

      // Предзагружаем следующую страницу
      if (currentPage < totalPages - 1) {
        promises.push(this.fetchPageDirectly({
          page: currentPage + 1,
          limit: params.limit,
          skills: params.skills
        }));
      }

      // Запускаем предзагрузку в фоне без ожидания результата
      if (promises.length > 0) {
        Promise.allSettled(promises).then(results => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          logger.debug(CONTEXT, `Предзагружено ${successful} из ${promises.length} страниц`);
        });
      }
    } catch (error) {
      // Ошибки предзагрузки не критичны, логируем и продолжаем
      logger.warn(CONTEXT, 'Ошибка при предзагрузке страниц', error);
    }
  }

  /**
   * Debounced метод для предотвращения множественных запросов.
   * Используется при быстрых переходах между страницами.
   */
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  async fetchVacanciesDebounced(
    params: VacanciesOptions,
    debounceKey: string = 'default',
    delay: number = 300
  ): Promise<VacanciesClientResponse> {
    return new Promise((resolve) => {
      // Отменяем предыдущий таймер для этого ключа
      const existingTimer = this.debounceTimers.get(debounceKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Устанавливаем новый таймер
      const timer = setTimeout(async () => {
        try {
          const result = await this.fetchVacanciesClient(params);
          resolve(result);
        } catch (error) {
          // В случае ошибки возвращаем пустой результат
          resolve({
            vacancies: [],
            total: 0,
            page: params.page || 0,
            limit: params.limit || 10,
            totalPages: 0,
            error: 'Ошибка при загрузке данных'
          });
        } finally {
          this.debounceTimers.delete(debounceKey);
        }
      }, delay);

      this.debounceTimers.set(debounceKey, timer);
    });
  }

  /**
   * Удаление вакансии по ID.
   * Возвращает результат операции для обработки в UI.
   */
  async deleteVacancy(id: string): Promise<{ success: boolean; title?: string; error?: string }> {
    try {
      logger.debug(CONTEXT, `Удаление вакансии с ID: ${id}`);
      return await vacancyApi.deleteVacancy(id);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Неизвестная ошибка при удалении вакансии';

      logger.error(CONTEXT, `Ошибка при удалении вакансии ${id}`, error);
      return { success: false, error: errorMessage };
    }
  }
}

// Singleton pattern для избежания множественных экземпляров
// и обеспечения единообразного состояния сервиса в приложении
export const vacancyService = new VacancyService();
