import express, { Request, Response, Router } from "express";
import { Vacancy, IVacancyDocument } from '../models/Vacancy.js';
import { FilterQuery } from "mongoose";
import type { PaginatedVacanciesResponse, VacancyDTO } from '@jspulse/shared';
import mongoose from "mongoose"; // Add mongoose import

const router: Router = express.Router();

// Получить все вакансии с пагинацией и фильтрацией
router.get("/", async (req: Request, res: Response) => {
  try {
    // Проверка подключения к MongoDB
    const db = mongoose.connection;
    console.log('MongoDB connection state:', db.readyState);
    console.log('Connected database:', db.name);
    console.log('MongoDB host:', db.host);
    console.log('MongoDB connection string:', process.env.MONGO_URL);
    console.log('Filter parameters:', req.query);
    
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = page * limit;

    const filter: FilterQuery<IVacancyDocument> = {};
    console.log('Initial filter:', filter);

    const skillsQuery = req.query.skills as string;
    if (skillsQuery) {
      const skillsArray = skillsQuery.split(",").map(skill => skill.trim());
      console.log('Processed skills filter:', skillsArray);
      filter.skills = { $all: skillsArray };
    }

    console.log('Final filter before query:', filter);
    const vacanciesDocs = await Vacancy.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IVacancyDocument[]>();

    // Теперь TypeScript знает тип doc
    // Явно указываем возвращаемый тип для map
    const vacancies: VacancyDTO[] = vacanciesDocs.map((doc): VacancyDTO => ({
      _id: doc._id.toString(),
      externalId: doc.externalId,
      title: doc.title,
      company: doc.company,
      location: doc.location,
      url: doc.url,
      // Передаем Date напрямую, без toISOString()
      publishedAt: doc.publishedAt,
      source: doc.source,
      description: doc.description,
      schedule: doc.schedule,
      skills: doc.skills || [],
      salaryFrom: doc.salaryFrom,
      salaryTo: doc.salaryTo,
      salaryCurrency: doc.salaryCurrency,
      experience: doc.experience,
      employment: doc.employment,
      address: doc.address,
    }));

    const totalCount = await Vacancy.countDocuments(filter);

    // Формируем ответ согласно PaginatedVacanciesResponse
    const response: PaginatedVacanciesResponse = {
      status: "OK",
      message: "Вакансии успешно получены",
      data: {
        vacancies,
        total: totalCount, // Используем поле total
        page: page, // Текущая страница
        limit: limit, // Лимит на странице
        totalPages: Math.ceil(totalCount / limit), // Общее количество страниц
      },
    };

    // Логируем полный ответ перед отправкой
    console.log("Ответ API (/api/vacancies):");
    console.log(JSON.stringify(response, null, 2));

    res.json(response);
  } catch (error: unknown) {
    console.error("Ошибка при получении вакансий:", error);
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    // Возвращаем стандартизированный ответ об ошибке
    res.status(500).json({
        status: "ERROR",
        message: "Ошибка сервера при получении вакансий",
        error: message
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

// В GET /:id тоже стоит проверить возвращаемый тип и структуру ответа
// Например, использовать ApiSingleResponse<VacancyDTO> из shared/types/dto/api.dto.ts

export default router;
