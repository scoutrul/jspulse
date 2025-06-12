#!/usr/bin/env node

/**
 * 🐳 Демонстрация SchedulerService в Docker контейнере
 * 
 * Этот скрипт показывает как SchedulerService работает в продакшен режиме
 * с автоматическими задачами по расписанию.
 */

import { SchedulerService } from '../services/SchedulerService.js';

console.log('🐳 Docker Scheduler Demo');
console.log('========================');

// Создаем scheduler с production настройками
const scheduler = new SchedulerService({
  // Production настройки - выполняем задачи каждые 8 часов
  hhParserSchedule: '0 */8 * * *',         // каждые 8 часов
  hhParserEnabled: true,

  cleanupSchedule: '0 2 * * 0',            // воскресенье в 2:00 (раз в неделю)
  cleanupEnabled: true,

  healthCheckSchedule: '*/30 * * * *',     // каждые 30 минут
  healthCheckEnabled: true,

  maxRetries: 3,
  retryDelay: 5000,
  enableNotifications: true,
  logToFile: false  // Выводим логи в консоль для Docker
});

console.log('⏰ Starting SchedulerService...');

// Обработчики событий для демонстрации
scheduler.on('jobStarted', ({ jobId, job }) => {
  console.log(`🎯 Job started: ${job.name} (${jobId})`);
});

scheduler.on('jobCompleted', ({ jobId, job, success, error }) => {
  if (success) {
    console.log(`✅ Job completed successfully: ${job.name} (${jobId})`);
  } else {
    console.log(`❌ Job failed: ${job.name} (${jobId})`, error?.message);
  }
});

scheduler.on('healthCheck', (status) => {
  console.log(`❤️ Health check:`, {
    timestamp: status.timestamp,
    runningJobs: status.scheduler.runningJobs,
    totalJobs: status.scheduler.jobsCount
  });
});

scheduler.on('notification', ({ type, title, message }) => {
  console.log(`🔔 Notification [${type}]: ${title} - ${message}`);
});

// Запускаем scheduler
try {
  scheduler.start();
  console.log('✅ SchedulerService started successfully!');

  // Показываем статистику каждые 10 секунд
  setInterval(async () => {
    const jobs = scheduler.getJobsStatus();
    const health = await scheduler.getHealth();

    console.log('\n📊 Scheduler Statistics:');
    console.log(`├─ Status: ${health.status}`);
    console.log(`├─ Uptime: ${Math.round(health.uptime / 1000)}s`);
    console.log(`├─ Total Jobs: ${health.totalJobs}`);
    console.log(`├─ Running Jobs: ${health.runningJobs}`);
    console.log(`└─ Jobs Overview:`);

    jobs.forEach(job => {
      console.log(`   ├─ ${job.name}: ${job.enabled ? '🟢 enabled' : '🔴 disabled'}`);
      console.log(`   │  ├─ Runs: ${job.runCount} (✅ ${job.successCount}, ❌ ${job.errorCount})`);
      console.log(`   │  ├─ Last run: ${job.lastRun ? job.lastRun.toISOString() : 'never'}`);
      console.log(`   │  └─ Schedule: ${job.schedule}`);
    });
    console.log('');
  }, 10000);

  // Демонстрация ручного запуска задачи через 5 секунд
  setTimeout(() => {
    console.log('🎮 Manual execution demo: running health-check manually...');
    scheduler.runJobManually('health-check');
  }, 5000);

} catch (error) {
  console.error('❌ Failed to start SchedulerService:', error);
  process.exit(1);
}

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🔄 Graceful shutdown initiated...');
  try {
    await scheduler.stop();
    console.log('✅ SchedulerService stopped successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('🚀 Scheduler demo running! Press Ctrl+C to stop...'); 