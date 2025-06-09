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
   * Получение детальной информации о вакансии для страницы просмотра.
   * Возвращает null при ошибках, чтобы компонент мог показать fallback.
   */
  async fetchVacancyByIdClient(
    id: string
  ): Promise<VacancyDTO | null> {
    try {
      logger.debug(CONTEXT, `Запрос вакансии с ID: ${id}`);
      return await vacancyApi.fetchVacancyById(id);
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
        skills: params.skills
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
}

// Singleton pattern для избежания множественных экземпляров
// и обеспечения единообразного состояния сервиса в приложении
export const vacancyService = new VacancyService();
