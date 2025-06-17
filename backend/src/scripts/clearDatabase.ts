import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import "dotenv/config";
import { Vacancy } from "../models/Vacancy.js";

const mongoUrl =
  process.env.NODE_ENV === "development" ? process.env.MONGO_URI_LOCALHOST : process.env.MONGO_URI;

if (!mongoUrl) {
  console.error("Error: MONGO_URI is not set.");
  process.exit(1);
}

async function clearDatabase() {
  const startTime = Date.now();
  let stats = {
    deletedVacancies: 0,
    success: false,
    executionTime: 0,
    error: null as string | null
  };

  try {
    await mongoose.connect(mongoUrl as string);
    console.log("✅ Connected to MongoDB for database clearing");

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
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
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
