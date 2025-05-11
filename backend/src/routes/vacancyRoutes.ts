import express, { Request, Response, Router, RequestHandler, NextFunction } from "express";
import { Vacancy } from "../models/Vacancy.js";
import { isValidObjectId } from "mongoose";
import {
  VacancyDTOSchema,
  VacancySearchSchema,
  ApiResponseSchema,
  VacancyDTO
} from "@jspulse/shared";
import { z } from "zod";
import { validateBody, validateQuery, validateParams } from "../middleware/validation.middleware.js";

const router: Router = express.Router();

// ID параметр схема
const IdParamSchema = z.object({
  id: z.string().refine(val => isValidObjectId(val), {
    message: "Некорректный ID вакансии"
  })
});

// Схема поиска по навыкам
const SkillsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().default(10),
  page: z.coerce.number().int().nonnegative().default(0)
});

// Эндпоинт для получения списка всех доступных навыков
router.get("/skills", async (req: Request, res: Response) => {
  console.log("[GET /api/vacancies/skills] Запрос на получение всех навыков");
  try {
    // Используем агрегацию MongoDB для получения уникальных навыков
    const skillsAggregation = await Vacancy.aggregate([
      { $unwind: "$skills" }, // Разворачиваем массив skills
      { $group: { _id: "$skills" } }, // Группируем по уникальным значениям
      { $sort: { _id: 1 } }, // Сортируем по алфавиту
    ]);

    const skills = skillsAggregation.map((item) => item._id);
    console.log(`[GET /api/vacancies/skills] Найдено ${skills.length} уникальных навыков`);

    res.json({
      success: true,
      data: skills,
      meta: {
        count: skills.length
      }
    });
  } catch (error) {
    console.error("[GET /api/vacancies/skills] Ошибка:", error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Ошибка сервера при получении списка навыков",
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
});

// Используем правильную типизацию для Express
router.get("/", validateQuery(SkillsQuerySchema), async (req: Request, res: Response) => {
  console.log("[GET /api/vacancies] Запрос получен");
  console.log("[GET /api/vacancies] Query параметры:", req.query);
  console.log("[GET /api/vacancies] Сырые параметры req.query.page:", req.query.page, "типа:", typeof req.query.page);

  // Проверяем, что происходит с validatedQuery
  console.log("[GET /api/vacancies] validatedQuery:", req.validatedQuery);

  // Получаем параметры из validatedQuery после валидации 
  const page = req.validatedQuery.page;
  const limit = req.validatedQuery.limit;

  console.log(`[GET /api/vacancies] Обработанные параметры: page=${page}, limit=${limit}`);

  const skills = req.query.skills;

  const query: any = {};
  if (skills) {
    // Обрабатываем любой формат skills - как строку, так и массив
    const skillsArray = Array.isArray(skills)
      ? skills
      : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : []);

    if (skillsArray.length > 0) {
      console.log("[GET /api/vacancies] Фильтрация по навыкам:", skillsArray);
      query.skills = { $in: skillsArray };
    }
  }

  try {
    console.log("[GET /api/vacancies] Начинаем запрос к БД с query:", query);
    const total = await Vacancy.countDocuments(query);
    console.log(`[GET /api/vacancies] Найдено total: ${total}`);

    // Рассчитываем offset для пропуска записей вместо использования page
    const offset = page * limit;
    console.log(`[GET /api/vacancies] Используем offset=${offset} (page=${page} * limit=${limit})`);

    const vacancies = await Vacancy.find(query)
      .limit(limit)
      .skip(offset)
      .sort({ publishedAt: -1 })
      .lean<VacancyDTO[]>();
    console.log(`[GET /api/vacancies] Получено вакансий из БД: ${vacancies.length}`);

    // Валидируем вакансии через Zod
    const validatedVacancies = vacancies.map(vacancy => {
      // Преобразуем ObjectId в строку
      const vacancyWithStringId = {
        ...vacancy,
        _id: vacancy._id ? vacancy._id.toString() : ''
      };

      // Валидируем через схему
      const result = VacancyDTOSchema.safeParse(vacancyWithStringId);

      // Если невалидно, логируем и возвращаем исправленную версию
      if (!result.success) {
        console.warn(`[GET /api/vacancies] Невалидная вакансия ${vacancy._id}:`, result.error);
        // Применяем дефолтные значения
        return {
          ...vacancyWithStringId,
          skills: Array.isArray(vacancy.skills) ? vacancy.skills : [],
          publishedAt: new Date()
        };
      }

      return result.data;
    });

    res.json({
      success: true,
      data: validatedVacancies,
      meta: {
        page: page,
        limit: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit) - 1,
        hasPrevPage: page > 0
      }
    });
  } catch (error) {
    console.error("[GET /api/vacancies] Ошибка в блоке try/catch:", error);
    console.log("[GET /api/vacancies] Отправка ответа 500...");
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Ошибка сервера при получении вакансий",
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
});

router.get("/:id", validateParams(IdParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const vacancy = await Vacancy.findById(id).lean<VacancyDTO>();

    if (!vacancy) {
      console.log(`[GET /vacancies/${id}] Вакансия не найдена`);
      res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: "Вакансия не найдена"
        }
      });
      return;
    }

    // Преобразуем _id из ObjectId в строку
    const vacancyWithStringId = {
      ...vacancy,
      _id: vacancy._id ? vacancy._id.toString() : ''
    };

    // Валидируем вакансию через Zod
    const result = VacancyDTOSchema.safeParse(vacancyWithStringId);

    if (!result.success) {
      console.warn(`[GET /vacancies/${id}] Невалидная вакансия:`, result.error);
      // В случае проблем с форматом данных пытаемся исправить их
      res.json({
        success: true,
        data: {
          ...vacancyWithStringId,
          skills: Array.isArray(vacancy.skills) ? vacancy.skills : [],
          publishedAt: vacancy.publishedAt instanceof Date ?
            vacancy.publishedAt : new Date(vacancy.publishedAt || Date.now())
        }
      });
      return;
    }

    console.log(`[GET /vacancies/${id}] Вакансия найдена:`, result.data.title);
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error(`Ошибка при получении вакансии ${id}:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: `Ошибка сервера при получении вакансии ${id}`,
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
});

export default router;
