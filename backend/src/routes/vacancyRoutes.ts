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
  try {
    // Используем агрегацию MongoDB для получения уникальных навыков
    const skillsAggregation = await Vacancy.aggregate([
      { $unwind: "$skills" }, // Разворачиваем массив skills
      { $group: { _id: "$skills" } }, // Группируем по уникальным значениям
      { $sort: { _id: 1 } }, // Сортируем по алфавиту
    ]);

    const skills = skillsAggregation.map((item) => item._id);

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

// Получение списка вакансий с пагинацией и фильтрацией
router.get("/", validateQuery(SkillsQuerySchema), async (req: Request, res: Response) => {
  // Получаем параметры из validatedQuery после валидации 
  const page = req.validatedQuery.page;
  const limit = req.validatedQuery.limit;
  const skills = req.query.skills;

  const query: any = {};
  if (skills) {
    // Обрабатываем любой формат skills - как строку, так и массив
    const skillsArray = Array.isArray(skills)
      ? skills
      : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : []);

    if (skillsArray.length > 0) {
      query.skills = { $in: skillsArray };
    }
  }

  try {
    const total = await Vacancy.countDocuments(query);

    // Рассчитываем offset для пропуска записей
    const offset = page * limit;

    const vacancies = await Vacancy.find(query)
      .limit(limit)
      .skip(offset)
      .sort({ publishedAt: -1 })
      .lean<VacancyDTO[]>();

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
    console.error("[GET /api/vacancies] Ошибка:", error);
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

// Получение одной вакансии по ID
router.get("/:id", validateParams(IdParamSchema), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const vacancy = await Vacancy.findById(id).lean<VacancyDTO>();

    if (!vacancy) {
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
