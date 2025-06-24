import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "../config/db.js";
import { Vacancy } from "../models/Vacancy.js";
import mockVacancies from "./mockVacancies.js";

/**
 * Заполняет базу данных тестовыми вакансиями
 * Возвращает статистику выполнения
 */
export async function executeSeedDatabase(): Promise<{
  success: boolean;
  deletedCount: number;
  insertedCount: number;
  uniqueSkills: number;
  executionTime: number;
  output: string[];
  error?: string;
}> {
  const startTime = Date.now();
  const output: string[] = [];

  // Проверяем, есть ли уже активное подключение
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    // Используем URI из переменных окружения, с приоритетом для локального MongoDB
    const mongoUrl =
      process.env.MONGO_URI_LOCALHOST || process.env.MONGO_URI || "mongodb://localhost:27017/jspulse";

    output.push("Подключение к MongoDB для заполнения тестовыми данными...");
    console.log("Подключение к MongoDB для заполнения тестовыми данными...");

    try {
      await mongoose.connect(mongoUrl);
      output.push("MongoDB подключен для сидинга.");
      console.log("MongoDB подключен для сидинга.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      output.push(`Ошибка подключения к MongoDB: ${errorMessage}`);
      console.error("Ошибка подключения к MongoDB:", error);

      return {
        success: false,
        deletedCount: 0,
        insertedCount: 0,
        uniqueSkills: 0,
        executionTime: Date.now() - startTime,
        output,
        error: errorMessage
      };
    }
  } else {
    output.push("Используется существующее подключение к MongoDB.");
    console.log("Используется существующее подключение к MongoDB.");
  }

  try {
    output.push("Очистка коллекции тестовых вакансий...");
    console.log("Очистка коллекции тестовых вакансий...");

    const deleteResult = await Vacancy.deleteMany({ source: "mock" });
    const deletedCount = deleteResult.deletedCount || 0;

    output.push(`Старые тестовые данные удалены (${deletedCount} вакансий).`);
    console.log("Старые тестовые данные удалены.");

    // Убедимся, что в моковых вакансиях есть все необходимые поля
    const validatedVacancies = mockVacancies.map((vacancy) => {
      // Обязательно должны быть skills для фильтрации
      if (!vacancy.skills || !Array.isArray(vacancy.skills) || vacancy.skills.length === 0) {
        vacancy.skills = ["javascript"];
        console.warn(`Для вакансии "${vacancy.title}" добавлен дефолтный навык javascript`);
      }
      return vacancy;
    });

    output.push("Добавление тестовых вакансий...");
    console.log("Добавление тестовых вакансий...");

    const result = await Vacancy.insertMany(validatedVacancies);
    const insertedCount = result.length;

    output.push(`Успешно добавлено ${insertedCount} тестовых вакансий`);
    console.log(`Успешно добавлено ${insertedCount} тестовых вакансий`);

    output.push("Добавленные вакансии (первые 5):");
    console.log("Добавленные вакансии (первые 5):");

    result.slice(0, 5).forEach((vacancy, index) => {
      const v = vacancy.toObject();
      const vacancyInfo = `${index + 1}. ${v.title} - ${v.company} - Навыки: ${v.skills?.join(", ")}`;
      output.push(vacancyInfo);
      console.log(vacancyInfo);
    });

    if (result.length > 5) {
      const moreInfo = `... и еще ${result.length - 5}`;
      output.push(moreInfo);
      console.log(moreInfo);
    }

    // Проверим, что вакансии доступны через API фильтрации
    const uniqueSkills = new Set<string>();
    result.forEach((vacancy) => {
      const v = vacancy.toObject();
      v.skills?.forEach((skill) => uniqueSkills.add(skill));
    });

    const skillsInfo = `Доступно ${uniqueSkills.size} уникальных навыков для фильтрации:`;
    output.push(skillsInfo);
    console.log(skillsInfo);

    const skillsList = Array.from(uniqueSkills).join(", ");
    output.push(skillsList);
    console.log(skillsList);

    // Дополнительная проверка: получаем все уникальные навыки из ВСЕХ вакансий в БД
    output.push("\nПроверка всех уникальных навыков в базе данных после сидинга:");
    console.log("\nПроверка всех уникальных навыков в базе данных после сидинга:");

    const allSkillsAggregation = await Vacancy.aggregate([
      { $match: { skills: { $exists: true, $ne: [] } } }, // Убедимся, что skills существуют и не пустые
      { $unwind: "$skills" },
      { $group: { _id: "$skills" } },
      { $sort: { _id: 1 } },
    ]);
    const allUniqueSkillsFromDB = allSkillsAggregation.map((item) => item._id);

    const dbSkillsInfo = `Найдено всего ${allUniqueSkillsFromDB.length} уникальных навыков во всей коллекции Vacancy:`;
    output.push(dbSkillsInfo);
    console.log(dbSkillsInfo);

    const dbSkillsList = allUniqueSkillsFromDB.join(", ");
    output.push(dbSkillsList);
    console.log(dbSkillsList);

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      deletedCount,
      insertedCount,
      uniqueSkills: allUniqueSkillsFromDB.length,
      executionTime,
      output
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    output.push(`Ошибка при заполнении базы данных: ${errorMessage}`);

    if (error instanceof Error) {
      console.error("Ошибка при заполнении базы данных:", error.message);
    } else {
      console.error("Неизвестная ошибка при заполнении базы данных:", error);
    }

    return {
      success: false,
      deletedCount: 0,
      insertedCount: 0,
      uniqueSkills: 0,
      executionTime: Date.now() - startTime,
      output,
      error: errorMessage
    };
  } finally {
    // Не закрываем подключение, если мы его не создавали
    if (!isConnected) {
      await mongoose.disconnect();
      output.push("Соединение с MongoDB закрыто.");
      console.log("Соединение с MongoDB закрыто.");
    } else {
      output.push("Подключение к MongoDB остается активным.");
      console.log("Подключение к MongoDB остается активным.");
    }
  }
}

/**
 * Заполняет базу данных тестовыми вакансиями (старая функция для обратной совместимости)
 */
async function seedDatabase() {
  const result = await executeSeedDatabase();
  if (!result.success) {
    process.exit(1);
  }
}

// Запускаем функцию только если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

// Экспортируем функцию для использования в API
export default executeSeedDatabase;
