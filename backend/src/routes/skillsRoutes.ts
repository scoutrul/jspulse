import { Router, Request, Response } from 'express';
import { SkillsController } from '../presentation/controllers/SkillsController.js';
import { GetUniqueSkillsUseCase } from '../application/use-cases/GetUniqueSkillsUseCase.js';

const router: Router = Router();

/**
 * Создание controller с dependency injection
 * В реальном приложении это будет делаться через DI Container
 */
const createSkillsController = (req: Request): SkillsController => {
  // Получаем Use Case из DI Container
  const getUniqueSkillsUseCase = req.resolve<GetUniqueSkillsUseCase>('GetUniqueSkillsUseCase');
  return new SkillsController(getUniqueSkillsUseCase);
};

/**
 * GET /api/skills
 * Получение уникальных навыков через Clean Architecture
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const skillsController = createSkillsController(req);
    await skillsController.getUniqueSkills(req, res);
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

export default router;
