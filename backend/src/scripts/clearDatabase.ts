import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Загружаем переменные окружения из .env файла бэкенда
// Используем import.meta.url для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const MONGO_URI = process.env.MONGO_URI;

async function clearDatabase() {
  if (!MONGO_URI) {
    console.error("Ошибка: Переменная окружения MONGO_URI не установлена.");
    process.exit(1);
  }

  console.log("Подключение к MongoDB...");
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Подключено к MongoDB для очистки");

    const collections = await mongoose.connection.db.collections();
    console.log(
      "Найденные коллекции:",
      collections.map((c) => c.collectionName)
    );

    let deletedCount = 0;
    for (const collection of collections) {
      console.log(`Очистка коллекции: ${collection.collectionName}...`);
      const result = await collection.deleteMany({});
      console.log(` -> Удалено документов: ${result.deletedCount}`);
      deletedCount += result.deletedCount ?? 0;
    }

    console.log(`\nОчистка завершена. Всего удалено документов: ${deletedCount}`);
  } catch (error) {
    console.error("Ошибка при очистке базы данных:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Соединение с MongoDB закрыто");
  }
}

clearDatabase();
