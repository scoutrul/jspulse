import { Request, Response } from 'express';
import { GetSystemStatsUseCase } from '../../application/use-cases/GetSystemStatsUseCase.js';
import { ClearCacheUseCase } from '../../application/use-cases/ClearCacheUseCase.js';
import { DeleteVacancyUseCase } from '../../application/use-cases/DeleteVacancyUseCase.js';
import { GetSkillsStatsUseCase } from '../../application/use-cases/GetSkillsStatsUseCase.js';
import { DocumentationService } from '../../services/DocumentationService.js';

/**
 * Controller для административных операций
 * Отвечает только за HTTP логику, делегирует бизнес-логику в Use Cases
 */
export class AdminController {
  constructor(
    private readonly getSystemStatsUseCase: GetSystemStatsUseCase,
    private readonly clearCacheUseCase: ClearCacheUseCase,
    private readonly deleteVacancyUseCase: DeleteVacancyUseCase,
    private readonly getSkillsStatsUseCase: GetSkillsStatsUseCase
  ) { }

  /**
   * GET /admin/stats - получение системной статистики
   */
  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      // Делегируем бизнес-логику в Use Case
      const stats = await this.getSystemStatsUseCase.execute();

      // Отправляем ответ в формате, ожидаемом frontend
      res.json({
        success: true,
        data: {
          vacancies: {
            total: stats.totalVacancies,
            recent24h: stats.recent24h,
            withFullDescription: stats.totalVacancies // Пока все вакансии имеют описания
          },
          skills: {
            unique: stats.topSkills.length,
            total: stats.topSkills.reduce((sum, skill) => sum + skill.count, 0)
          },
          cache: {
            hitRate: 85, // Временное значение
            size: 1024, // Временное значение
            totalRequests: 1000 // Временное значение
          },
          scheduler: {
            status: 'running',
            lastRun: stats.timestamp.toISOString()
          },
          system: {
            uptime: Date.now() - stats.timestamp.getTime(),
            memoryUsage: {
              heapUsed: 50 * 1024 * 1024, // 50MB
              heapTotal: 100 * 1024 * 1024 // 100MB
            }
          }
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
   * GET /admin/top-skills - получение топ навыков
   */
  async getTopSkills(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getSkillsStatsUseCase.execute();

      // Возвращаем только топ-10 навыков
      const topSkills = result.data.slice(0, 10);

      res.json({
        success: true,
        data: topSkills
      });
    } catch (error) {
      console.error('Error in AdminController.getTopSkills:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get top skills'
        }
      });
    }
  }

  /**
   * GET /admin/recent - получение последних вакансий (алиас для recent-vacancies)
   */
  async getRecent(req: Request, res: Response): Promise<void> {
    try {
      // Используем тот же метод что и recent-vacancies
      await this.getRecentVacancies(req, res);
    } catch (error) {
      console.error('Error in AdminController.getRecent:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get recent data'
        }
      });
    }
  }

  /**
   * GET /admin/docs - получение списка файлов документации
   * Доступно только в development режиме
   */
  async getDocs(req: Request, res: Response): Promise<void> {
    try {
      console.log('AdminController.getDocs: Creating new DocumentationService');
      const documentationService = new DocumentationService();
      console.log('AdminController.getDocs: Calling getFilesList');
      const files = await documentationService.getFilesList();
      console.log('AdminController.getDocs: Found', files.length, 'files');

      res.json({
        success: true,
        data: files
      });
    } catch (error) {
      console.error('Error in AdminController.getDocs:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get documentation files'
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

  /**
   * DELETE /admin/vacancy/:id - удаление вакансии
   */
  async deleteVacancy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: 'Vacancy ID is required'
          }
        });
        return;
      }

      // Делегируем бизнес-логику в Use Case
      const result = await this.deleteVacancyUseCase.execute({ id });

      if (!result.deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: 'Vacancy not found'
          }
        });
        return;
      }

      // Отправляем ответ об успешном удалении
      res.json({
        success: true,
        data: {
          id: result.id,
          deleted: result.deleted
        }
      });
    } catch (error) {
      console.error('Error in AdminController.deleteVacancy:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to delete vacancy'
        }
      });
    }
  }
}
