import express, { Request, Response, Router, RequestHandler, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import {
  VacancyDTOSchema,
  VacancySearchSchema,
  ApiResponseSchema,
  VacancyDTO,
  DI_TOKENS,
  IVacancyRepository,
  ICacheService,
  PAGINATION
} from "@jspulse/shared";
import { z } from "zod";
import { validateBody, validateQuery, validateParams } from "../middleware/validation.middleware.js";

const router: Router = express.Router();

/**
 * Схема валидации для параметра ID.
 * Проверяет корректность MongoDB ObjectId для предотвращения некорректных запросов.
 */
const IdParamSchema = z.object({
  id: z.string().refine(val => isValidObjectId(val), {
    message: "Некорректный ID вакансии"
  })
});

/**
 * Схема валидации для параметров поиска навыков.
 * Обеспечивает корректность пагинации и предотвращает некорректные значения.
 */
const SkillsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().default(PAGINATION.DEFAULT_PAGE_SIZE),
  page: z.coerce.number().int().nonnegative().default(PAGINATION.VALIDATION.MIN_PAGE)
});

/**
 * GET /skills/stats - Получение статистики навыков с количеством вакансий.
 * Используется для визуализации популярности навыков в пузырьковой диаграмме.
 */
router.get("/skills/stats", async (req: Request, res: Response) => {
  try {
    // Получаем Repository из DI Container
    const vacancyRepository = req.resolve<IVacancyRepository>(DI_TOKENS.VACANCY_REPOSITORY);

    // Получаем полную статистику и извлекаем данные о навыках
    const statistics = await vacancyRepository.getStatistics();

    res.json({
      success: true,
      data: statistics.bySkills,
      meta: {
        count: statistics.bySkills.length,
        totalVacancies: statistics.total
      }
    });
  } catch (error) {
    console.error("[GET /api/vacancies/skills/stats] Ошибка:", error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Ошибка сервера при получении статистики навыков",
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
});

/**
 * GET /skills - Получение уникальных навыков из всех вакансий.
 * Используется для автокомплита в фильтрах на фронтенде.
 * Теперь использует Repository с агрессивным кэшированием (30 минут).
 */
router.get("/skills", async (req: Request, res: Response) => {
  try {
    // Получаем Repository из DI Container
    const vacancyRepository = req.resolve<IVacancyRepository>(DI_TOKENS.VACANCY_REPOSITORY);

    // Делегируем логику получения навыков в Repository с кэшированием
    const skills = await vacancyRepository.getUniqueSkills();

    res.json({
      success: true,
      data: skills,
      meta: {
        count: skills.length
      }
    });
  } catch (error) {
    console.error("[GET /api/vacancies/skills] Ошибка:", error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Ошибка сервера при получении списка навыков",
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
});

/**
 * GET / - Получение списка вакансий с пагинацией и фильтрацией по навыкам.
 * Основной эндпоинт для отображения вакансий на главной странице.
 * Использует Repository Pattern с интеллектуальным кэшированием (3-5 минут).
 */
router.get("/", validateQuery(SkillsQuerySchema), async (req: Request, res: Response) => {
  // Параметры получены из middleware валидации для безопасности типов
  const page = req.validatedQuery.page;
  const limit = req.validatedQuery.limit;
  const skills = req.query.skills;

  try {
    // Получаем Repository из DI Container
    const vacancyRepository = req.resolve<IVacancyRepository>(DI_TOKENS.VACANCY_REPOSITORY);

    // Подготавливаем критерии поиска для Repository
    // Приводим query параметры к строковому массиву для типобезопасности
    let skillsArray: string[] | undefined = undefined;
    if (skills) {
      if (Array.isArray(skills)) {
        skillsArray = skills.filter((skill): skill is string => typeof skill === 'string');
      } else if (typeof skills === 'string') {
        skillsArray = skills.split(',').map(s => s.trim());
      }
    }

    // Используем специализированный метод Repository для фильтрации с кэшированием
    const result = await vacancyRepository.findWithFilters({
      page,
      limit,
      skills: skillsArray
    });

    res.json({
      success: true,
      data: result.data,
      meta: {
        page: result.meta.page,
        limit: result.meta.limit,
        totalItems: result.meta.total,
        totalPages: result.meta.totalPages,
        hasNextPage: result.meta.hasNextPage,
        hasPrevPage: result.meta.hasPrevPage
      }
    });
  } catch (error) {
    console.error("[GET /api/vacancies] Ошибка:", error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Ошибка сервера при получении вакансий",
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
});

/**
 * GET /cache/stats - Получение статистики кэша для мониторинга.
 * Вспомогательный эндпоинт для отладки и оптимизации производительности.
 */
router.get("/cache/stats", async (req: Request, res: Response) => {
  try {
    // Получаем Cache Service из DI Container
    const cacheService = req.resolve<ICacheService>(DI_TOKENS.CACHE_SERVICE);
    const stats = await cacheService.getStats();

    res.json({
      success: true,
      data: stats,
      meta: {
        description: "Статистика кэша вакансий",
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("[GET /api/vacancies/cache/stats] Ошибка:", error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Ошибка при получении статистики кэша",
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
});

/**
 * GET /:id - Получение детальной информации о вакансии.
 * Используется на странице просмотра конкретной вакансии.
 * Repository обеспечивает валидацию ID и кэширование отдельных записей (15 минут).
 */
router.get("/:id", validateParams(IdParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Получаем Repository из DI Container
    const vacancyRepository = req.resolve<IVacancyRepository>(DI_TOKENS.VACANCY_REPOSITORY);

    // Repository инкапсулирует валидацию ObjectId, обработку ошибок и кэширование
    const vacancy = await vacancyRepository.findById(id);

    if (!vacancy) {
      res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: "Вакансия не найдена"
        }
      });
      return;
    }

    // Принудительно добавляем поле для тестирования
    const testVacancy = {
      ...vacancy,
      fullDescription: "FORCED_FULL_DESCRIPTION_TEST",
      testFullDesc: "FORCED_TEST_VALUE"
    };

    console.log('🚨 FORCED DEBUG: Поля вакансии:', Object.keys(testVacancy));
    console.log('🚨 FORCED DEBUG: fullDescription:', testVacancy.fullDescription);

    res.json({
      success: true,
      data: testVacancy
    });
  } catch (error) {
    console.error(`Ошибка при получении вакансии ${id}:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: `Ошибка сервера при получении вакансии ${id}`,
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
});

export default router;
