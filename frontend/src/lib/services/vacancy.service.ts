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
class VacancyService {
  /**
   * Клиентский метод для загрузки вакансий с пагинацией и фильтрацией.
   * Используется на фронтенде в компонентах.
   */
  async fetchVacanciesClient(options: {
    page?: number;
    limit?: number;
    skills?: string[];
  } = {}): Promise<VacanciesClientResponse> {
    try {
      const result = await vacancyApi.fetchVacancies({
        page: options.page,
        limit: options.limit,
        skills: options.skills
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

      return {
        vacancies: [],
        total: 0,
        page: 0,
        limit: 10,
        totalPages: 0,
        error: errorMessage
      };
    }
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
}

// Создаем и экспортируем синглтон
export const vacancyService = new VacancyService();
