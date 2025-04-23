import express, { Request, Response } from "express";
import { Vacancy } from "../models/Vacancy.js"; // Импортируем TS модель

const router = express.Router();

// Получить все вакансии
router.get("/", async (req: Request, res: Response) => {
  try {
    // Тип Vacancy уже известен из Mongoose модели
    const vacancies = await Vacancy.find().sort({ publishedAt: -1 }); // Сортируем по дате публикации
    res.json({
      status: "OK",
      message: "Вакансии успешно получены",
      data: vacancies,
    });
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

    const _tagsArray = tags.split(",");

    // Внимание: поле 'tags' больше не существует в модели Vacancy.
    // Нужно решить, как будет работать фильтрация (например, по полю 'skills').
    // Пока возвращаем пустой массив или ошибку.

    /* 
    const vacancies = await Vacancy.find({
      tags: { $in: tagsArray } // ЗАМЕНИТЬ tags на skills или другой механизм
    }).sort({ publishedAt: -1 });
    
    res.json({ 
      status: 'OK',
      message: 'Вакансии успешно отфильтрованы по тегам',
      data: vacancies
    }); 
    */

    // Временный ответ, пока фильтрация не исправлена
    res.status(501).json({
      status: "ERROR",
      message: "Фильтрация по тегам временно не реализована (поле tags удалено из модели)",
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
