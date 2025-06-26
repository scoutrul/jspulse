import { connectDB } from "../config/db.js";
import { Vacancy } from "../models/Vacancy.js";
import type { VacancyDTO } from "@jspulse/shared";

async function testPagination() {
  console.log("Тестирование пагинации MongoDB...");

  try {
    // Подключаемся к БД
    await connectDB();
    console.log("Подключение к MongoDB установлено");

    // Получаем общее количество вакансий
    const total = await Vacancy.countDocuments();
    console.log(`Всего вакансий в базе: ${total}`);

    // Параметры пагинации
    const limit = 3;

    // Тестирование разных страниц
    for (let page = 0; page < 3; page++) {
      const offset = page * limit;

      console.log(`\n--- Запрос для page=${page}, limit=${limit}, offset=${offset} ---`);

      // Выполняем запрос с пагинацией
      const vacancies = await Vacancy.find({})
        .limit(limit)
        .skip(offset)
        .sort({ publishedAt: -1 })
        .lean() as VacancyDTO[];

      console.log(`Получено вакансий: ${vacancies.length}`);

      // Выводим ID и заголовки вакансий
      vacancies.forEach((v: any, i: number) => {
        console.log(`${i + 1}. ${v._id}: ${v.title}`);
      });
    }
  } catch (error) {
    console.error("Ошибка при тестировании пагинации:", error);
  } finally {
    // Завершаем процесс после тестирования
    process.exit(0);
  }
}

// Запускаем тестирование
testPagination(); 