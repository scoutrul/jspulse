import { Router, Request, Response } from 'express';
import { DIContainer } from '../container/DIContainer.js';
import { SchedulerService } from '../services/SchedulerService.js';

const container = new DIContainer();

/**
 * 🕰️ Scheduler Management API Routes
 * 
 * Endpoints для управления и мониторинга автоматических задач:
 * - GET /status - статистика всех задач
 * - POST /jobs/:jobId/run - ручной запуск задачи
 * - PUT /jobs/:jobId/config - обновление конфигурации задачи
 * - GET /health - health check scheduler'а
 */

const router: Router = Router();

// Получаем SchedulerService из DI Container
const getSchedulerService = (): SchedulerService => {
  return container.resolve<SchedulerService>('schedulerService');
};

/**
 * 📊 GET /api/scheduler/status
 * Получение статистики всех запланированных задач
 */
router.get('/status', (req, res) => {
  try {
    const schedulerService = getSchedulerService();
    const jobsStatus = schedulerService.getJobsStatus();

    const response = {
      success: true,
      data: {
        summary: {
          totalJobs: jobsStatus.length,
          enabledJobs: jobsStatus.filter(job => job.enabled).length,
          runningJobs: jobsStatus.filter(job => job.running).length,
          totalRuns: jobsStatus.reduce((sum, job) => sum + job.runCount, 0),
          totalSuccesses: jobsStatus.reduce((sum, job) => sum + job.successCount, 0),
          totalErrors: jobsStatus.reduce((sum, job) => sum + job.errorCount, 0)
        },
        jobs: jobsStatus
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler status',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 🎮 POST /api/scheduler/jobs/:jobId/run
 * Ручной запуск конкретной задачи
 */
router.post('/jobs/:jobId/run', async (req, res) => {
  try {
    const { jobId } = req.params;
    const schedulerService = getSchedulerService();

    // Запускаем задачу асинхронно
    schedulerService.runJobManually(jobId)
      .then(() => {
        console.log(`✅ Manual job execution completed: ${jobId}`);
      })
      .catch((error) => {
        console.error(`❌ Manual job execution failed: ${jobId}`, error);
      });

    res.json({
      success: true,
      message: `Job ${jobId} started manually`,
      data: { jobId }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to run job manually',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * ⚙️ PUT /api/scheduler/jobs/:jobId/config
 * Обновление конфигурации задачи (расписание, включение/отключение)
 */
router.put('/jobs/:jobId/config', (req, res) => {
  try {
    const { jobId } = req.params;
    const { schedule, enabled } = req.body;

    // Валидация входных данных
    if (schedule && typeof schedule !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Schedule must be a valid cron string'
      });
      return;
    }

    if (enabled !== undefined && typeof enabled !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'Enabled must be a boolean'
      });
      return;
    }

    const schedulerService = getSchedulerService();
    const updates: { schedule?: string; enabled?: boolean } = {};

    if (schedule) updates.schedule = schedule;
    if (enabled !== undefined) updates.enabled = enabled;

    schedulerService.updateJobConfig(jobId, updates);

    res.json({
      success: true,
      message: `Job ${jobId} configuration updated`,
      data: { jobId, updates }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update job configuration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * ❤️ GET /api/scheduler/health
 * Health check scheduler'а с детальной информацией
 */
router.get('/health', (req, res) => {
  try {
    const schedulerService = getSchedulerService();
    const jobsStatus = schedulerService.getJobsStatus();

    const now = new Date();
    const healthData = {
      status: 'healthy',
      timestamp: now.toISOString(),
      uptime: process.uptime(),
      jobs: {
        total: jobsStatus.length,
        enabled: jobsStatus.filter(job => job.enabled).length,
        running: jobsStatus.filter(job => job.running).length,
        recentFailures: jobsStatus.filter(job => {
          if (!job.lastError) return false;
          const timeDiff = now.getTime() - job.lastError.getTime();
          return timeDiff < 3600000; // Последний час
        }).length
      },
      lastActivity: {
        mostRecentRun: jobsStatus
          .filter(job => job.lastRun)
          .sort((a, b) => (b.lastRun?.getTime() || 0) - (a.lastRun?.getTime() || 0))[0]?.lastRun,
        mostRecentSuccess: jobsStatus
          .filter(job => job.lastSuccess)
          .sort((a, b) => (b.lastSuccess?.getTime() || 0) - (a.lastSuccess?.getTime() || 0))[0]?.lastSuccess
      }
    };

    // Определяем общий статус здоровья
    if (healthData.jobs.recentFailures > 0) {
      healthData.status = 'warning';
    }

    if (healthData.jobs.running > 0 && healthData.jobs.enabled === 0) {
      healthData.status = 'unhealthy';
    }

    res.json({
      success: true,
      data: healthData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler health',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 📝 GET /api/scheduler/logs
 * Получение последних логов scheduler'а (если включено логирование)
 */
router.get('/logs', (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Здесь можно реализовать получение логов из файла или памяти
    // Пока возвращаем placeholder
    res.json({
      success: true,
      data: {
        message: 'Log retrieval not implemented yet',
        suggestion: 'Check console output or implement file-based logging'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get scheduler logs',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 