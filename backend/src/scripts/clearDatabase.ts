import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { Vacancy } from "../models/Vacancy.js"; 

// Загружаем переменные окружения из .env файла бэкенда
// Используем import.meta.url для ESM
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

async function clearDatabase() {
  if (!MONGO_URI) {
    console.error("Ошибка: Переменная окружения MONGO_URI не установлена.");
    process.exit(1);
  }

  console.log("Подключение к MongoDB...");
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB подключен.");

    console.log("Очистка коллекции vacancies...");
    const deleteResult = await Vacancy.deleteMany({});
    console.log(`Удалено ${deleteResult.deletedCount} вакансий.`);
  } catch (error) {
    console.error("Ошибка при очистке базы данных:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Отключено от MongoDB.");
  }
}

clearDatabase();
