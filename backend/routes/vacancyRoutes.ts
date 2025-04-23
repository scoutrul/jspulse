import express, { Request, Response } from "express";
import { Vacancy } from "../models/Vacancy.js"; // Импортируем TS модель
import { FilterQuery } from "mongoose";
import { IVacancyDocument } from "../models/Vacancy.js"; // Implied import for IVacancyDocument

const router = express.Router();

// Получить все вакансии
router.get("/", async (req: Request, res: Response) => {
  try {
    // Базовый объект фильтрации
    const filter: FilterQuery<IVacancyDocument> = {};

    // Обработка query параметров для фильтрации
    if (Object.keys(req.query).length > 0) {
      // Тип Vacancy уже известен из Mongoose модели
      const vacancies = await Vacancy.find(filter).sort({ publishedAt: -1 }); // Сортируем по дате публикации
      res.json({
        status: "OK",
        message: "Вакансии успешно получены",
        data: vacancies,
      });
    } else {
      const vacancies = await Vacancy.find().sort({ publishedAt: -1 }); // Сортируем по дате публикации
      res.json({
        status: "OK",
        message: "Вакансии успешно получены",
        data: vacancies,
      });
    }
  } catch (error: unknown) {
    // Используем unknown и проверяем тип
    console.error("Ошибка при получении вакансий:", error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    res.status(500).json({
      status: "ERROR",
      message: "Ошибка при получении вакансий",
      error: message,
    });
  }
});

// Получить вакансию по ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const vacancy = await Vacancy.findById(req.params.id);

    if (!vacancy) {
      res.status(404).json({
        status: "ERROR",
        message: "Вакансия не найдена",
      });
      return;
    }

    res.json({
      status: "OK",
      message: "Вакансия успешно получена",
      data: vacancy,
    });
  } catch (error: unknown) {
    console.error(`Ошибка при получении вакансии ${req.params.id}:`, error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    res.status(500).json({
      status: "ERROR",
      message: "Ошибка при получении вакансии",
      error: message,
    });
  }
});

// Фильтрация вакансий по тегам (TODO: Поле tags удалено из модели, нужно заменить на skills?)
router.get("/filter/tags", async (req: Request, res: Response) => {
  try {
    const { tags } = req.query;

    if (!tags || typeof tags !== "string") {
      // Добавлена проверка типа
      res.status(400).json({
        status: "ERROR",
        message: "Не указаны теги для фильтрации (ожидается строка)",
      });
      return;
    }

    // Логика для фильтрации по нескольким тегам
    // const tagsQuery = tags.map((tag) => ({ skills: tag })); // Массив условий { skills: tag }
    // filter.skills = { $all: tags };
    const tagsArray = Array.isArray(tags) ? tags : tags.split(","); // Если tags - строка, разбиваем по запятой
    const filter = {
      skills: { $all: tagsArray },
    };

    // Используем созданный фильтр
    const vacancies = await Vacancy.find(filter).sort({ publishedAt: -1 });

    res.json({
      status: "OK",
      message: "Вакансии успешно отфильтрованы по навыкам",
      data: vacancies,
    });
  } catch (error: unknown) {
    console.error("Ошибка при фильтрации вакансий:", error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    res.status(500).json({
      status: "ERROR",
      message: "Ошибка при фильтрации вакансий",
      error: message,
    });
  }
});

export default router; // Используем export default
