import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Global test setup - выполняется перед всеми тестами
let mongoServer: MongoMemoryServer;

/**
 * Глобальная настройка перед запуском тестов
 * Инициализирует in-memory MongoDB для изоляции тестов
 */
export const setupTestEnvironment = async (): Promise<void> => {
  // Создаем in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'jspulse-test'
    }
  });

  const mongoUri = mongoServer.getUri();

  // Подключаемся к тестовой базе данных
  await mongoose.connect(mongoUri);

  // Устанавливаем переменные окружения для тестов
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = mongoUri;
  process.env.CACHE_TTL_DEFAULT = '300'; // 5 минут для тестов
  process.env.CACHE_MAX_SIZE = '100'; // Меньший размер для тестов
};

/**
 * Очистка после всех тестов
 * Закрывает соединения и останавливает MongoDB instance
 */
export const teardownTestEnvironment = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Очистка базы данных между тестами
 * Удаляет все данные но сохраняет структуру
 */
export const cleanupDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

// Настройка Jest hooks
beforeAll(async () => {
  await setupTestEnvironment();
});

afterAll(async () => {
  await teardownTestEnvironment();
});

afterEach(async () => {
  await cleanupDatabase();
}); 