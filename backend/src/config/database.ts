import mongoose from 'mongoose';

/**
 * Подключение к MongoDB с обработкой ошибок и логированием.
 * Использует переменные окружения для конфигурации.
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