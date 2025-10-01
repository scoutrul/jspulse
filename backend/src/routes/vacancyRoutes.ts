import { Router, Request, Response } from 'express';
import { VacancyController } from '../presentation/controllers/VacancyController.js';
import { GetVacancyByIdUseCase } from '../application/use-cases/GetVacancyByIdUseCase.js';
import { GetVacanciesUseCase } from '../application/use-cases/GetVacanciesUseCase.js';
import { GetSkillsUseCase } from '../application/use-cases/GetSkillsUseCase.js';
import { GetSkillsStatsUseCase } from '../application/use-cases/GetSkillsStatsUseCase.js';
import { GetSourcesUseCase } from '../application/use-cases/GetSourcesUseCase.js';

const router: Router = Router();

/**
 * Создание controller с dependency injection
 * В реальном приложении это будет делаться через DI Container
 */
const createVacancyController = (req: Request): VacancyController => {
  // Получаем Use Cases из DI Container
  const getVacancyByIdUseCase = req.resolve<GetVacancyByIdUseCase>('GetVacancyByIdUseCase');
  const getVacanciesUseCase = req.resolve<GetVacanciesUseCase>('GetVacanciesUseCase');
  const getSkillsUseCase = req.resolve<GetSkillsUseCase>('GetSkillsUseCase');
  const getSkillsStatsUseCase = req.resolve<GetSkillsStatsUseCase>('GetSkillsStatsUseCase');
  const getSourcesUseCase = req.resolve<GetSourcesUseCase>('GetSourcesUseCase');

  return new VacancyController(
    getVacanciesUseCase,
    getVacancyByIdUseCase,
    getSkillsUseCase,
    getSkillsStatsUseCase,
    getSourcesUseCase
  );
};

/**
 * GET /api/vacancies - получение списка вакансий с фильтрацией
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const vacancyController = createVacancyController(req);
    await vacancyController.getVacancies(req, res);
  } catch (error) {
    console.error('Error in vacancies route:', error);
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
 * GET /api/vacancies/skills - получение списка всех навыков
 */
router.get('/skills', async (req: Request, res: Response) => {
  try {
    const vacancyController = createVacancyController(req);
    await vacancyController.getSkills(req, res);
  } catch (error) {
    console.error('Error in skills route:', error);
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
 * GET /api/vacancies/skills/stats - получение статистики по навыкам
 */
router.get('/skills/stats', async (req: Request, res: Response) => {
  try {
    const vacancyController = createVacancyController(req);
    await vacancyController.getSkillsStats(req, res);
  } catch (error) {
    console.error('Error in skills stats route:', error);
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
 * GET /api/vacancies/sources - получение списка источников по данным вакансий
 */
router.get('/sources', async (req: Request, res: Response) => {
  try {
    const vacancyController = createVacancyController(req);
    await vacancyController.getSources(req, res);
  } catch (error) {
    console.error('Error in sources route:', error);
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
 * GET /api/vacancies/:id - получение вакансии по ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vacancyController = createVacancyController(req);
    await vacancyController.getVacancyById(req, res);
  } catch (error) {
    console.error('Error in vacancy by ID route:', error);
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
 * PATCH /api/vacancies/:id/visit - отметка вакансии как посещенной
 */
router.patch('/:id/visit', async (req: Request, res: Response) => {
  try {
    const vacancyController = createVacancyController(req);
    await vacancyController.markAsVisited(req, res);
  } catch (error) {
    console.error('Error in mark as visited route:', error);
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
