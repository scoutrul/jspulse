import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "../config/db.js";
import { Vacancy } from "../models/Vacancy.js";
import mockVacancies from "./mockVacancies.js";

/**
 * Заполняет базу данных тестовыми вакансиями
 */
async function seedDatabase() {
  // Используем URI из переменных окружения, с приоритетом для локального MongoDB
  const mongoUrl =
    process.env.MONGO_URI_LOCALHOST || process.env.MONGO_URI || "mongodb://localhost:27017/jspulse";

  console.log("Подключение к MongoDB для заполнения тестовыми данными...");
  try {
    await mongoose.connect(mongoUrl);
    console.log("MongoDB подключен для сидинга.");

    console.log("Очистка коллекции тестовых вакансий...");
    await Vacancy.deleteMany({ source: "mock" });
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

    console.log("Добавление тестовых вакансий...");
    const result = await Vacancy.insertMany(validatedVacancies);
    console.log(`Успешно добавлено ${result.length} тестовых вакансий`);

    console.log("Добавленные вакансии (первые 5):");
    result.slice(0, 5).forEach((vacancy, index) => {
      const v = vacancy.toObject();
      console.log(`${index + 1}. ${v.title} - ${v.company} - Навыки: ${v.skills?.join(", ")}`);
    });
    if (result.length > 5) {
      console.log("... и еще", result.length - 5);
    }

    // Проверим, что вакансии доступны через API фильтрации
    const uniqueSkills = new Set<string>();
    result.forEach((vacancy) => {
      const v = vacancy.toObject();
      v.skills?.forEach((skill) => uniqueSkills.add(skill));
    });
    console.log(`Доступно ${uniqueSkills.size} уникальных навыков для фильтрации:`);
    console.log(Array.from(uniqueSkills).join(", "));

    // Дополнительная проверка: получаем все уникальные навыки из ВСЕХ вакансий в БД
    console.log("\nПроверка всех уникальных навыков в базе данных после сидинга:");
    const allSkillsAggregation = await Vacancy.aggregate([
      { $match: { skills: { $exists: true, $ne: [] } } }, // Убедимся, что skills существуют и не пустые
      { $unwind: "$skills" },
      { $group: { _id: "$skills" } },
      { $sort: { _id: 1 } },
    ]);
    const allUniqueSkillsFromDB = allSkillsAggregation.map((item) => item._id);
    console.log(`Найдено всего ${allUniqueSkillsFromDB.length} уникальных навыков во всей коллекции Vacancy:`);
    console.log(allUniqueSkillsFromDB.join(", "));

  } catch (error) {
    if (error instanceof Error) {
      console.error("Ошибка при заполнении базы данных:", error.message);
    } else {
      console.error("Неизвестная ошибка при заполнении базы данных:", error);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Соединение с MongoDB закрыто.");
  }
}

// Запускаем функцию
seedDatabase();
