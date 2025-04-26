import mongoose from "mongoose";
import { MONGO_URI } from "./api.js"; // Импортируем URI из центрального конфига

/**
 * Устанавливает соединение с базой данных MongoDB.
 */
export const connectDB = async () => {
  if (!MONGO_URI) {
    console.error("Ошибка: Переменная окружения MONGO_URI не определена в конфигурации.");
    process.exit(1); // Выход из приложения, если нет URI
  }

  try {
    // Используем импортированный MONGO_URI
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Таймаут выбора сервера
      socketTimeoutMS: 45000, // Таймаут сокета
    });
    console.log("MongoDB подключена успешно.");
  } catch (error) {
    console.error("Ошибка подключения к MongoDB:", error);
    // В случае ошибки при инициализации, обычно лучше завершить приложение
    process.exit(1);
  }
};
