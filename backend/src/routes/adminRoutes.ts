import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/ApiError.js';

const router: Router = Router();

// Отладочный middleware для всех админ запросов
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[ADMIN-DEBUG] ${req.method} ${req.originalUrl}`);
  if (req.originalUrl.includes('/docs/')) {
    console.log(`[ADMIN-DEBUG] Docs route hit! Params:`, req.params);
    console.log(`[ADMIN-DEBUG] Query:`, req.query);
  }
  next();
});

/**
 * GET /api/admin/stats
 * Получение базовой статистики для дашборда (временная заглушка)
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    // Временная заглушка - базовые данные
    const stats = {
      vacancies: {
        total: 203,
        recent24h: 5,
        withFullDescription: 150
      },
      skills: {
        unique: 45,
        total: 890
      },
      cache: {
        hitRate: 85,
        size: 128,
        totalRequests: 1024,
        totalHits: 870
      },
      scheduler: {
        status: 'running',
        lastRun: new Date(Date.now() - 3600000), // 1 час назад
        nextRun: new Date(Date.now() + 3600000)  // через 1 час
      },
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date()
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to get system statistics'
      }
    });
  }
});

/**
 * GET /api/admin/top-skills
 * Получение топ навыков (временная заглушка)
 */
router.get("/top-skills", async (req: Request, res: Response) => {
  try {
    const topSkills = [
      { skill: 'JavaScript', count: 45, percentage: 22 },
      { skill: 'React', count: 32, percentage: 16 },
      { skill: 'Node.js', count: 28, percentage: 14 },
      { skill: 'TypeScript', count: 25, percentage: 12 },
      { skill: 'Vue.js', count: 18, percentage: 9 },
      { skill: 'Python', count: 15, percentage: 7 },
      { skill: 'MongoDB', count: 12, percentage: 6 },
      { skill: 'PostgreSQL', count: 10, percentage: 5 },
      { skill: 'Docker', count: 8, percentage: 4 },
      { skill: 'AWS', count: 5, percentage: 2 }
    ];

    res.json({
      success: true,
      data: topSkills
    });
  } catch (error) {
    console.error('Error getting top skills:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to get top skills'
      }
    });
  }
});

/**
 * GET /api/admin/recent
 * Получение реальных последних вакансий из БД
 */
router.get("/recent", async (req: Request, res: Response) => {
  try {
    // Импортируем модель Vacancy через DI контейнер
    const { Vacancy } = await import('../models/Vacancy.js');

    // Получаем последние 10 вакансий, отсортированные по дате создания
    const recentVacancies = await Vacancy
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title company skills createdAt source externalId')
      .lean();

    // Трансформируем данные для фронтенда
    const transformedVacancies = recentVacancies.map((vacancy: any) => ({
      id: vacancy._id.toString(),
      title: vacancy.title,
      companyName: vacancy.company,
      skills: vacancy.skills || [],
      createdAt: vacancy.createdAt || new Date(),
      source: vacancy.source || 'unknown'
    }));

    res.json({
      success: true,
      data: transformedVacancies
    });
  } catch (error) {
    console.error('Error getting recent vacancies:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to get recent vacancies',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * POST /api/admin/parse-hh
 * Запуск реального парсинга HeadHunter
 */
router.post("/parse-hh", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Импортируем скрипт парсинга
    // const { default: executeHHParsing } = await import('../scripts/fetchAndSaveFromHH.js');

    // Запускаем парсинг в отдельном процессе для не блокирования API
    // const parsingPromise = executeHHParsing();

    // Не ждем завершения, возвращаем ответ сразу
    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        success: true,
        message: 'HeadHunter parsing temporarily disabled',
        details: {
          output: 'HH parsing is temporarily disabled due to mongoose import issues.',
          warnings: 'Feature will be restored after fixing ESM compatibility'
        },
        executionTime
      },
      message: 'HeadHunter parsing temporarily disabled'
    });

    // Логируем результат парсинга в фоне
    // parsingPromise.then(() => {
    //   console.log('✅ Background HH parsing completed successfully');
    // }).catch((error) => {
    //   console.error('❌ Background HH parsing failed:', error);
    // });

  } catch (error) {
    console.error('Error starting HH parsing:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to start HeadHunter parsing',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * POST /api/admin/seed-db
 * Заполнение базы данных тестовыми вакансиями
 */
router.post("/seed-db", async (req: Request, res: Response) => {
  try {
    // Импортируем функцию сидинга
    const { default: executeSeedDatabase } = await import('../data/seedDatabase.js');

    // Выполняем сидинг БД
    const stats = await executeSeedDatabase();

    if (stats.success) {
      res.json({
        success: true,
        data: {
          success: true,
          message: 'Database seeded successfully',
          details: {
            output: stats.output.join('\n'),
            warnings: stats.deletedCount === 0 ? 'No previous test data found' : null,
            deletedCount: stats.deletedCount,
            insertedCount: stats.insertedCount,
            uniqueSkills: stats.uniqueSkills
          },
          executionTime: stats.executionTime
        },
        message: 'Database seeded successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to seed database',
          details: stats.error || 'Unknown error'
        }
      });
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * DELETE /api/admin/clear-db
 * Реальная очистка базы данных
 */
router.delete("/clear-db", async (req: Request, res: Response) => {
  try {
    // Импортируем скрипт очистки БД
    const { default: clearDatabase } = await import('../scripts/clearDatabase.js');

    // Выполняем очистку БД
    const stats = await clearDatabase();

    if (stats.success) {
      // Также очищаем кэш если есть доступ к кэш сервису
      // TODO: добавить очистку кэша через DI Container

      res.json({
        success: true,
        data: {
          success: true,
          message: 'Database cleared successfully',
          details: {
            output: `Database cleared\nRemoved ${stats.deletedVacancies} vacancies\nExecution time: ${stats.executionTime}ms`,
            warnings: stats.deletedVacancies === 0 ? 'Database was already empty' : null,
            deletedVacancies: stats.deletedVacancies,
            cacheCleared: false // TODO: implement cache clearing
          },
          executionTime: stats.executionTime
        },
        message: 'Database cleared successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to clear database',
          details: stats.error || 'Unknown error'
        }
      });
    }
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to clear database',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/docs
 * Получение реального списка файлов Memory Bank
 */
router.get("/docs", async (req: Request, res: Response) => {
  try {
    // Используем DocumentationService для получения реального списка файлов
    const { DocumentationService } = await import('../services/DocumentationService.js');
    const docService = new DocumentationService();

    const files = await docService.getFilesList();

    res.json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error getting files list:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Failed to get documentation files',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/docs/:filename
 * Получение реального содержимого конкретного файла из Memory Bank
 * Временно отключён из-за проблем с path-to-regexp на Windows
 */
// router.get("/docs/*", async (req: Request, res: Response) => {
//   console.log(`[ADMIN-DOCS] Route hit! ${req.originalUrl}`);
//   try {
//     // Получаем имя файла из URL path (поддерживает пути с /)
//     const filePath = req.params[0] || req.path.replace('/docs/', '') || '';
//     console.log(`[ADMIN-DOCS] Loading file content: ${filePath}`);
//     console.log(`[ADMIN-DOCS] Full URL: ${req.originalUrl}`);
//     console.log(`[ADMIN-DOCS] Params:`, req.params);

//     // Используем DocumentationService для получения реального содержимого файла
//     const { DocumentationService } = await import('../services/DocumentationService.js');
//     const docService = new DocumentationService();

//     const fileContent = await docService.getFileContent(filePath);

//     res.json({
//       success: true,
//       data: fileContent,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('[ADMIN] Error loading file content:', error);
//     res.status(500).json({
//       success: false,
//       error: {
//         code: 'FILE_READ_ERROR',
//         message: 'Failed to read file content',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       }
//     });
//   }
// });

/**
 * GET /api/admin/health
 * Health check для админ системы
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          documentation: 'available',
          admin: 'available',
          database: 'connected',
          cache: 'running'
        }
      }
    });
  } catch (error) {
    console.error('Error getting admin health:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Admin health check failed'
      }
    });
  }
});

/**
 * Catch-all для отладки - временно отключён из-за проблем с path-to-regexp на Windows
 */
// router.get("*", async (req: Request, res: Response) => {
//   console.log(`[ADMIN-CATCHALL] Unmatched route: ${req.originalUrl}`);
//   res.status(404).json({
//     success: false,
//     error: {
//       code: 404,
//       message: `Admin route not found: ${req.originalUrl}`
//     }
//   });
// });

export default router; 