import mongoose from 'mongoose';

/**
 * Подключение к MongoDB с обработкой ошибок и логированием.
 * Используется в основном приложении (app.ts).
 */
export async function connectToDatabase(): Promise<void> {
  try {
    // Проверяем, не подключены ли мы уже к базе данных
    if (mongoose.connection.readyState === 1) {
      console.log('✅ Already connected to MongoDB');
      return;
    }

    // Если есть активное подключение с другим состоянием, отключаемся
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('📝 Disconnected from previous MongoDB connection');
    }

    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/jspulse';

    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Подключение к MongoDB для скриптов и тестов.
 * Завершает процесс при ошибке подключения.
 */
export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/jspulse';

  if (!mongoUri) {
    console.error("Ошибка: Переменная окружения MONGO_URI не определена в конфигурации.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB подключена успешно.");
  } catch (error) {
    console.error("Ошибка подключения к MongoDB:", error);
    process.exit(1);
  }
};

/**
 * Закрытие подключения к MongoDB.
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
}

/**
 * Получение состояния подключения к MongoDB.
 */
export function getConnectionStatus(): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
}

/**
 * Проверка валидности ObjectId.
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

// Экспортируем mongoose для использования в других модулях
export { mongoose };
export default mongoose; 