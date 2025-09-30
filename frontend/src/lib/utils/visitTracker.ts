import { vacancyApi } from '$lib/api/vacancy.api.js';
import { logger } from '$lib/utils/logger.js';

/**
 * Утилита для отслеживания посещений вакансий
 */
export class VisitTracker {
  private static instance: VisitTracker;
  private visitedVacancies: Set<string> = new Set();
  private readonly CONTEXT = 'VisitTracker';

  private constructor() {
    // Загружаем посещенные вакансии из localStorage при инициализации
    this.loadVisitedVacancies();
  }

  public static getInstance(): VisitTracker {
    if (!VisitTracker.instance) {
      VisitTracker.instance = new VisitTracker();
    }
    return VisitTracker.instance;
  }

  /**
   * Загружает список посещенных вакансий из localStorage
   */
  private loadVisitedVacancies(): void {
    try {
      const stored = localStorage.getItem('visited-vacancies');
      if (stored) {
        const visited = JSON.parse(stored) as string[];
        this.visitedVacancies = new Set(visited);
        logger.debug(this.CONTEXT, `Загружено ${visited.length} посещенных вакансий`);
      }
    } catch (error) {
      logger.error(this.CONTEXT, 'Ошибка при загрузке посещенных вакансий', error);
    }
  }

  /**
   * Сохраняет список посещенных вакансий в localStorage
   */
  private saveVisitedVacancies(): void {
    try {
      const visited = Array.from(this.visitedVacancies);
      localStorage.setItem('visited-vacancies', JSON.stringify(visited));
      logger.debug(this.CONTEXT, `Сохранено ${visited.length} посещенных вакансий`);
    } catch (error) {
      logger.error(this.CONTEXT, 'Ошибка при сохранении посещенных вакансий', error);
    }
  }

  /**
   * Проверяет, была ли вакансия посещена
   */
  public isVisited(vacancyId: string): boolean {
    return this.visitedVacancies.has(vacancyId);
  }

  /**
   * Отмечает вакансию как посещенную
   */
  public async markAsVisited(vacancyId: string): Promise<boolean> {
    if (this.visitedVacancies.has(vacancyId)) {
      return true; // Уже посещена
    }

    try {
      // Отправляем запрос на сервер
      const result = await vacancyApi.markAsVisited(vacancyId);

      if (result.success) {
        // Добавляем в локальный кэш
        this.visitedVacancies.add(vacancyId);
        this.saveVisitedVacancies();

        // Уведомляем компоненты об обновлении
        this.forceUpdate();

        logger.debug(this.CONTEXT, `Вакансия ${vacancyId} отмечена как посещенная`);
        return true;
      } else {
        logger.error(this.CONTEXT, `Ошибка отметки вакансии ${vacancyId}:`, result.error);
        return false;
      }
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка при отметке вакансии ${vacancyId}`, error);
      return false;
    }
  }

  /**
   * Обработчик клика по ссылке вакансии
   */
  public async handleVacancyClick(vacancyId: string): Promise<void> {
    if (!vacancyId) return;

    // Отмечаем как посещенную асинхронно (не блокируем переход)
    this.markAsVisited(vacancyId).catch(error => {
      logger.error(this.CONTEXT, `Ошибка при отметке вакансии ${vacancyId}`, error);
    });
  }

  /**
   * Обработчик клика по ссылке источника
   */
  public async handleSourceClick(vacancyId: string): Promise<void> {
    console.log('VisitTracker.handleSourceClick called', { vacancyId });
    if (!vacancyId) return;

    // Отмечаем как посещенную асинхронно (не блокируем переход)
    this.markAsVisited(vacancyId).catch(error => {
      logger.error(this.CONTEXT, `Ошибка при отметке вакансии ${vacancyId}`, error);
    });
  }

  /**
   * Принудительно обновляет состояние для всех компонентов
   */
  public forceUpdate(): void {
    // Диспатчим кастомное событие для уведомления компонентов
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('visitTrackerUpdated'));
    }
  }
}

// Экспортируем синглтон
export const visitTracker = VisitTracker.getInstance();
