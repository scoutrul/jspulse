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
 * Класс для работы с вакансиями, объединяющий различные источники данных
 * и предоставляющий удобные методы для клиентского и серверного кода
 */
export class VacancyService {
  // Инициализируем сервис без дополнительной конфигурации
  // Используем готовый vacancyApi для всех операций
  constructor() {
    logger.debug(CONTEXT, 'Инициализация VacancyService');
  }

  /**
   * Получение списка навыков на клиенте.
   */
  async fetchSkillsClient(): Promise<string[]> {
    try {
      logger.debug(CONTEXT, 'Запрос доступных навыков');
      return await vacancyApi.fetchSkills();
    } catch (error) {
      logger.error(CONTEXT, 'Ошибка при получении навыков', error);
      return [];
    }
  }

  /**
   * Получение детальной информации о вакансии на клиенте.
   */
  async fetchVacancyByIdClient(
    id: string
  ): Promise<VacancyDTO | null> {
    try {
      logger.debug(CONTEXT, `Запрос вакансии с ID: ${id}`);
      return await vacancyApi.fetchVacancyById(id);
    } catch (error) {
      logger.error(CONTEXT, `Ошибка при получении вакансии ${id}`, error);
      return null;
    }
  }

  /**
   * Получение списка вакансий с поддержкой пагинации
   * Возвращает типизированный ответ согласно DTO-схеме
   */
  async getVacancies(params: VacanciesOptions): Promise<VacanciesClientResponse> {
    try {
      logger.debug(CONTEXT, 'Запрос списка вакансий', { params });
      
      const result = await vacancyApi.fetchVacancies({
        page: params.page,
        limit: params.limit,
        skills: params.skills
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
        : 'Неизвестная ошибка при загрузке вакансий';

      logger.error(CONTEXT, 'Ошибка при получении вакансий', error);

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

// Экспортируем singleton экземпляр для использования в приложении
export const vacancyService = new VacancyService();
