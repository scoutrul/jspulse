import { createApp, gracefulShutdown } from './app.js';

/**
 * Главный entry point для backend сервера.
 * Инициализирует приложение и настраивает graceful shutdown.
 */
async function main() {
  try {
    // Создаем приложение с DI Container
    const { app, container } = await createApp();

    // Получаем порт из переменных окружения
    const PORT = process.env.PORT || 3001;

    // Запускаем сервер
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Container stats: http://localhost:${PORT}/api/container/stats`);
    });

    // Настраиваем graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('📡 SIGTERM received');
      server.close(() => {
        gracefulShutdown(container);
      });
    });

    process.on('SIGINT', async () => {
      console.log('📡 SIGINT received');
      server.close(() => {
        gracefulShutdown(container);
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
