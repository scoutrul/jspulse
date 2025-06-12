import express from 'express';
import cors from 'cors';
import { connectToDatabase } from './config/database.js';
import { containerFactory } from './container/ContainerFactory.js';
import { createDIMiddleware, diErrorHandler } from './middleware/diMiddleware.js';
import vacancyRoutes from './routes/vacancyRoutes.js';
import schedulerRoutes from './routes/schedulerRoutes.js';
import { SchedulerService } from './services/SchedulerService.js';

/**
 * Создание и настройка Express приложения с DI Container.
 * Инициализирует все необходимые middleware, маршруты и зависимости.
 */
export async function createApp(): Promise<{ app: express.Application; container: any; scheduler: SchedulerService }> {
  const app = express();

  // Подключение к MongoDB
  await connectToDatabase();

  // Создание production DI Container со всеми зависимостями
  const rootContainer = containerFactory.createProduction();

  // Валидация корректности настройки контейнера
  const validation = containerFactory.validateContainer(rootContainer);
  if (!validation.isValid) {
    console.error('❌ DI Container validation failed:', validation.errors);
    throw new Error('Invalid DI Container configuration');
  }

  console.log('✅ DI Container validation passed');

  // Инициализация и запуск SchedulerService
  const scheduler = rootContainer.resolve<SchedulerService>('SchedulerService');
  await scheduler.start();
  console.log('⏰ SchedulerService started successfully');

  // Настройка базовых middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Регистрируем DI middleware для всех маршрутов
  app.use(createDIMiddleware(rootContainer));

  // Логирование в development режиме
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  // Регистрация маршрутов
  app.use('/api/vacancies', vacancyRoutes);
  app.use('/api/scheduler', schedulerRoutes);

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const schedulerHealth = await scheduler.getHealth();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      container: {
        registeredServices: rootContainer.getRegisteredTokens().length,
        stats: (rootContainer as any).getStats?.()
      },
      scheduler: {
        status: schedulerHealth.status,
        totalJobs: schedulerHealth.totalJobs,
        runningJobs: schedulerHealth.runningJobs,
        lastError: schedulerHealth.lastError
      }
    });
  });

  // Эндпоинт для получения статистики DI Container
  app.get('/api/container/stats', (req, res) => {
    const stats = (rootContainer as any).getStats?.();
    res.json({
      success: true,
      data: {
        stats,
        registeredTokens: rootContainer.getRegisteredTokens().map(token => String(token))
      }
    });
  });

  // Error handling middleware
  app.use(diErrorHandler);

  // Общий error handler
  app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 404,
        message: 'Endpoint not found'
      }
    });
  });

  return { app, container: rootContainer, scheduler };
}

/**
 * Graceful shutdown handler для корректного освобождения ресурсов.
 */
export async function gracefulShutdown(container: any, scheduler: SchedulerService) {
  console.log('🔄 Starting graceful shutdown...');

  try {
    // Останавливаем scheduler первым делом
    console.log('⏰ Stopping scheduler...');
    await scheduler.stop();
    console.log('✅ Scheduler stopped successfully');

    // Освобождаем ресурсы DI Container
    await container.dispose();
    console.log('✅ DI Container disposed successfully');

    // Здесь можно добавить другие cleanup операции:
    // - Закрытие подключений к БД
    // - Завершение background tasks
    // - Сохранение state

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
} 