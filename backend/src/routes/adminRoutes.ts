import { Router, Request, Response } from 'express';
import { AdminController } from '../presentation/controllers/AdminController.js';
import { GetSystemStatsUseCase } from '../application/use-cases/GetSystemStatsUseCase.js';
import { ClearCacheUseCase } from '../application/use-cases/ClearCacheUseCase.js';
import { DeleteVacancyUseCase } from '../application/use-cases/DeleteVacancyUseCase.js';
import { GetSkillsStatsUseCase } from '../application/use-cases/GetSkillsStatsUseCase.js';

const router: Router = Router();

/**
 * Создание controller с dependency injection
 * В реальном приложении это будет делаться через DI Container
 */
const createAdminController = (req: Request): AdminController => {
  // Получаем Use Cases из DI Container
  const getSystemStatsUseCase = req.resolve<GetSystemStatsUseCase>('GetSystemStatsUseCase');
  const clearCacheUseCase = req.resolve<ClearCacheUseCase>('ClearCacheUseCase');
  const deleteVacancyUseCase = req.resolve<DeleteVacancyUseCase>('DeleteVacancyUseCase');
  const getSkillsStatsUseCase = req.resolve<GetSkillsStatsUseCase>('GetSkillsStatsUseCase');
  return new AdminController(getSystemStatsUseCase, clearCacheUseCase, deleteVacancyUseCase, getSkillsStatsUseCase);
};

/**
 * GET /admin/stats - получение системной статистики
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.getSystemStats(req, res);
  } catch (error) {
    console.error('Error in admin stats route:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * GET /admin/recent-vacancies - получение недавних вакансий
 */
router.get('/recent-vacancies', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.getRecentVacancies(req, res);
  } catch (error) {
    console.error('Error in admin recent-vacancies route:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * POST /admin/clear-cache - очистка кэша
 */
router.post('/clear-cache', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.clearCache(req, res);
  } catch (error) {
    console.error('Error in admin clear-cache route:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * DELETE /admin/vacancy/:id - удаление вакансии
 */
router.delete('/vacancy/:id', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.deleteVacancy(req, res);
  } catch (error) {
    console.error('Error in admin delete-vacancy route:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * GET /admin/top-skills - получение топ навыков
 */
router.get('/top-skills', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.getTopSkills(req, res);
  } catch (error) {
    console.error('Error in admin top-skills route:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * GET /admin/recent - получение последних вакансий (алиас)
 */
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.getRecent(req, res);
  } catch (error) {
    console.error('Error in admin recent route:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * GET /admin/docs - получение списка файлов документации
 */
router.get('/docs', async (req: Request, res: Response) => {
  try {
    const adminController = createAdminController(req);
    await adminController.getDocs(req, res);
  } catch (error) {
    console.error('Error in admin docs route:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

export default router;
