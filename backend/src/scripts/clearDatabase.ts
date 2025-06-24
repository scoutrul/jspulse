import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import "dotenv/config";
import { Vacancy } from "../models/Vacancy.js";

async function clearDatabase() {
  const startTime = Date.now();
  let stats = {
    deletedVacancies: 0,
    success: false,
    executionTime: 0,
    error: null as string | null
  };

  // Проверяем, есть ли уже активное подключение
  const isConnected = mongoose.connection.readyState === 1;

  try {
    if (!isConnected) {
      // Если нет активного подключения, создаем новое
      const mongoUrl =
        process.env.NODE_ENV === "development" ? process.env.MONGO_URI_LOCALHOST : process.env.MONGO_URI;

      if (!mongoUrl) {
        console.error("Error: MONGO_URI is not set.");
        stats.error = "MONGO_URI is not set";
        return stats;
      }

      await mongoose.connect(mongoUrl as string);
      console.log("✅ Connected to MongoDB for database clearing");
    } else {
      console.log("✅ Using existing MongoDB connection for database clearing");
    }

    console.log("🗑️ Clearing database...");

    // Получаем количество вакансий до удаления
    const countBefore = await Vacancy.countDocuments();
    console.log(`📊 Вакансий в БД до очистки: ${countBefore}`);

    // Удаляем все вакансии из базы данных
    const result = await Vacancy.deleteMany({});
    stats.deletedVacancies = result.deletedCount;

    console.log(`🗑️ Удалено вакансий: ${result.deletedCount}`);
    console.log("✅ Database cleared successfully.");

    stats.success = true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("❌ Error clearing the database:", error);
    stats.error = errorMessage;
  } finally {
    // Закрываем подключение только если мы его создали
    if (!isConnected) {
      await mongoose.disconnect();
      console.log("🔌 Disconnected from MongoDB");
    } else {
      console.log("🔌 Keeping existing MongoDB connection active");
    }
    stats.executionTime = Date.now() - startTime;
  }

  return stats;
}

// Запускать только при прямом вызове как CLI скрипт
if (import.meta.url === `file://${process.argv[1]}`) {
  clearDatabase().then(stats => {
    console.log('📊 Final stats:', stats);
    process.exit(stats.success ? 0 : 1);
  });
}

export default clearDatabase;
