import express, { Request, Response, Router } from "express";
import { Vacancy, IVacancyDocument } from "../models/Vacancy.js";
import { FilterQuery } from "mongoose";

const router: Router = express.Router();

// Получить все вакансии с пагинацией и фильтрацией
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Базовый объект фильтрации
    const filter: FilterQuery<IVacancyDocument> = {};

    // Обработка фильтра по навыкам (skills)
    const skillsQuery = req.query.skills as string;
    if (skillsQuery) {
      const skillsArray = skillsQuery
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill); // Разделяем, убираем пробелы, удаляем пустые строки
      if (skillsArray.length > 0) {
        // Используем $all для поиска вакансий, содержащих ВСЕ указанные навыки
        filter.skills = { $all: skillsArray };
      }
    }

    // TODO: Добавить обработку других query параметров для фильтрации, если нужно

    // Получаем вакансии для текущей страницы с учетом фильтра
    const vacancies = await Vacancy.find(filter) // <-- Используем filter
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Получаем общее количество вакансий, соответствующих фильтру
    const totalVacancies = await Vacancy.countDocuments(filter); // <-- Используем filter

    res.json({
      status: "OK",
      message: "Вакансии успешно получены",
      data: {
        vacancies: vacancies,
        total: totalVacancies,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalVacancies / limit),
      },
    });
  } catch (error: unknown) {
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

export default router; // Используем export default
