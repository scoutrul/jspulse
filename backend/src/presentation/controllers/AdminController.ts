import { Request, Response } from 'express';
import { GetSystemStatsUseCase } from '../../application/use-cases/GetSystemStatsUseCase.js';
import { ClearCacheUseCase } from '../../application/use-cases/ClearCacheUseCase.js';

/**
 * Controller для административных операций
 * Отвечает только за HTTP логику, делегирует бизнес-логику в Use Cases
 */
export class AdminController {
  constructor(
    private readonly getSystemStatsUseCase: GetSystemStatsUseCase,
    private readonly clearCacheUseCase: ClearCacheUseCase
  ) { }

  /**
   * GET /admin/stats - получение системной статистики
   */
  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      // Делегируем бизнес-логику в Use Case
      const stats = await this.getSystemStatsUseCase.execute();

      // Отправляем ответ
      res.json({
        success: true,
        data: {
          totalVacancies: stats.totalVacancies,
          recent24h: stats.recent24h,
          bySource: stats.bySource,
          topSkills: stats.topSkills,
          salaryStats: stats.salaryStats,
          workFormatStats: stats.workFormatStats,
          timestamp: stats.timestamp.toISOString()
        }
      });
    } catch (error) {
      console.error('Error in AdminController.getSystemStats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get system statistics'
        }
      });
    }
  }

  /**
   * GET /admin/recent-vacancies - получение недавних вакансий
   */
  async getRecentVacancies(req: Request, res: Response): Promise<void> {
    try {
      // В будущем здесь будет отдельный Use Case
      res.json({
        success: true,
        data: [],
        message: 'Recent vacancies endpoint - to be implemented'
      });
    } catch (error) {
      console.error('Error in AdminController.getRecentVacancies:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get recent vacancies'
        }
      });
    }
  }

  /**
   * POST /admin/clear-cache - очистка кэша
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      // Делегируем бизнес-логику в Use Case
      const result = await this.clearCacheUseCase.execute();

      // Отправляем ответ
      res.json({
        success: true,
        data: {
          clearedKeys: result.clearedKeys,
          timestamp: result.timestamp.toISOString()
        }
      });
    } catch (error) {
      console.error('Error in AdminController.clearCache:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to clear cache'
        }
      });
    }
  }
}
