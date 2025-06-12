import { SchedulerService } from '../services/SchedulerService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🧪 Test Scheduler - демонстрация автоматического планировщика
 * 
 * Запуск: npm run test:scheduler
 * Показывает работу scheduler'а с настроенными задачами
 */

async function testScheduler() {
  console.log('🧪 Testing Scheduler Service...\n');

  // Создаем scheduler с тестовой конфигурацией
  const scheduler = new SchedulerService({
    // Тестовые расписания (более частые для демонстрации)
    hhParserSchedule: '*/2 * * * *',        // Каждые 2 минуты
    hhParserEnabled: false,                  // Отключаем для теста

    cleanupSchedule: '*/5 * * * *',          // Каждые 5 минут  
    cleanupEnabled: true,
    cleanupDaysThreshold: 30,

    healthCheckSchedule: '*/1 * * * *',      // Каждую минуту
    healthCheckEnabled: true,

    maxRetries: 2,
    retryDelay: 5000,                        // 5 секунд

    enableNotifications: true,
    logToFile: false
  });

  // Настраиваем event listeners для мониторинга
  scheduler.on('started', () => {
    console.log('🚀 Scheduler started!');
  });

  scheduler.on('jobStarted', ({ jobId, job }) => {
    console.log(`▶️  Job started: ${job.name} (${jobId})`);
  });

  scheduler.on('jobCompleted', ({ jobId, job, success, error }) => {
    if (success) {
      console.log(`✅ Job completed: ${job.name} (${jobId})`);
    } else {
      console.log(`❌ Job failed: ${job.name} (${jobId}) - ${error?.message || 'Unknown error'}`);
    }
  });

  scheduler.on('notification', ({ type, title, message, jobId }) => {
    console.log(`🔔 ${type.toUpperCase()}: ${title} - ${message} (Job: ${jobId})`);
  });

  scheduler.on('healthCheck', (healthStatus) => {
    console.log(`❤️  Health Check:`, healthStatus);
  });

  // Запускаем scheduler
  scheduler.start();

  // Показываем статус задач
  console.log('\n📊 Initial Jobs Status:');
  console.table(scheduler.getJobsStatus());

  // Демонстрируем ручное выполнение задачи
  console.log('\n🎮 Testing manual job execution...');

  try {
    await scheduler.runJobManually('health-check');
    console.log('✅ Manual job execution completed');
  } catch (error) {
    console.error('❌ Manual job execution failed:', error);
  }

  // Показываем обновленный статус
  setTimeout(() => {
    console.log('\n📊 Updated Jobs Status:');
    console.table(scheduler.getJobsStatus());
  }, 2000);

  // Тестируем обновление конфигурации
  setTimeout(() => {
    console.log('\n⚙️  Testing configuration update...');

    scheduler.updateJobConfig('health-check', {
      schedule: '*/30 * * * * *', // Каждые 30 секунд
      enabled: true
    });

    console.log('✅ Configuration updated for health-check job');
  }, 5000);

  // Демонстрируем graceful shutdown
  setTimeout(async () => {
    console.log('\n🛑 Testing graceful shutdown...');
    await scheduler.stop();
    console.log('✅ Scheduler stopped gracefully');

    console.log('\n📊 Final Jobs Status:');
    console.table(scheduler.getJobsStatus());

    process.exit(0);
  }, 15000);

  // Обработка прерывания
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
    await scheduler.stop();
    process.exit(0);
  });

  console.log(`
🕰️  SCHEDULER DEMO RUNNING
┌─────────────────────────────────────────────┐
│ • Health checks every minute               │
│ • Database cleanup every 5 minutes         │
│ • HH Parser disabled for demo              │
│ • Manual job execution demonstrated        │
│ • Configuration updates shown              │
│ • Will auto-stop after 15 seconds          │
└─────────────────────────────────────────────┘

Press Ctrl+C to stop manually...
  `);
}

// Запускаем демонстрацию
testScheduler().catch(console.error); 