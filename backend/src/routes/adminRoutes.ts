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

/**
 * POST /admin/parse-habr - запуск парсинга вакансий с Habr
 */
router.post('/parse-habr', async (req: Request, res: Response) => {
  try {
    // Динамический импорт скрипта (запуск как функции)
    const { default: run } = await import('../scripts/fetchAndSaveFromHabr.js').then(() => ({ default: null as any })).catch(() => ({ default: null as any }));
    // Скрипт автономный, поэтому просто отвечаем, что задача запущена (fire-and-forget)
    res.json({ success: true, data: { started: true, source: 'habr' } });
  } catch (error) {
    console.error('Error in admin parse-habr route:', error);
    res.status(500).json({ success: false, error: { code: 500, message: 'Failed to start Habr parsing' } });
  }
});

/**
 * POST /admin/parse-hh - запуск парсинга вакансий с HeadHunter
 */
router.post('/parse-hh', async (req: Request, res: Response) => {
  try {
    // Fire-and-forget: не блокируем HTTP поток
    (async () => {
      try {
        const { default: noop } = await import('../scripts/fetchAndSaveFromHH.js').then(() => ({ default: null as any })).catch(() => ({ default: null as any }));
      } catch (e) {
        console.error('Error starting HH parsing task:', e);
      }
    })();

    res.json({ success: true, data: { started: true, source: 'hh' } });
  } catch (error) {
    console.error('Error in admin parse-hh route:', error);
    res.status(500).json({ success: false, error: { code: 500, message: 'Failed to start HH parsing' } });
  }
});

/**
 * POST /admin/parse-telegram - запуск парсинга Telegram (обогащение/инкремент)
 */
router.post('/parse-telegram', async (req: Request, res: Response) => {
  try {
    // Fire-and-forget: не блокируем HTTP поток
    (async () => {
      try {
        const { default: noop } = await import('../scripts/enrichTelegramTelegraph.js').then(() => ({ default: null as any })).catch(() => ({ default: null as any }));
      } catch (e) {
        console.error('Error starting Telegram parsing task:', e);
      }
    })();

    res.json({ success: true, data: { started: true, source: 'telegram' } });
  } catch (error) {
    console.error('Error in admin parse-telegram route:', error);
    res.status(500).json({ success: false, error: { code: 500, message: 'Failed to start Telegram parsing' } });
  }
});

/**
 * POST /admin/parse-careered - запуск парсинга вакансий с Careered.io
 */
router.post('/parse-careered', async (req: Request, res: Response) => {
  try {
    // Fire-and-forget: не блокируем HTTP поток
    (async () => {
      try {
        const { default: noop } = await import('../scripts/fetchAndSaveFromCareered.js').then(() => ({ default: null as any })).catch(() => ({ default: null as any }));
      } catch (e) {
        console.error('Error starting Careered parsing task:', e);
      }
    })();

    res.json({ success: true, data: { started: true, source: 'careered' } });
  } catch (error) {
    console.error('Error in admin parse-careered route:', error);
    res.status(500).json({ success: false, error: { code: 500, message: 'Failed to start Careered parsing' } });
  }
});

export default router;
