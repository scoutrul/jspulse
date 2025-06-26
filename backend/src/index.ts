import { createApp, gracefulShutdown } from './app';

/**
 * Главный entry point для backend сервера.
 * Инициализирует приложение и настраивает graceful shutdown.
 */
async function main() {
  try {
    // Создаем приложение с DI Container
    const { app, container, scheduler } = await createApp();

    // Получаем порт из переменных окружения
    const PORT = process.env.PORT || 3001;

    // Запускаем сервер
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Container stats: http://localhost:${PORT}/api/container/stats`);
      console.log(`⏰ Scheduler API: http://localhost:${PORT}/api/scheduler`);
    });

    // Настраиваем graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('📡 SIGTERM received');
      server.close(() => {
        gracefulShutdown(container, scheduler);
      });
    });

    process.on('SIGINT', async () => {
      console.log('📡 SIGINT received');
      server.close(() => {
        gracefulShutdown(container, scheduler);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unhandled error in main:', error);
  process.exit(1);
});
