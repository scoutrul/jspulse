import express, { Request, Response, Router, RequestHandler } from "express";
import { Vacancy } from "../models/Vacancy.js";
import { isValidObjectId } from "mongoose";
import { 
  VacancyDTOSchema, 
  VacancySearchSchema, 
  ApiResponseSchema,
  VacancyDTO,
  z
} from "@jspulse/shared";
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
  page: z.coerce.number().int().nonnegative().default(0),
  skills: z.string().optional()
});

// Эндпоинт для получения списка всех доступных навыков
router.get("/skills", (async (req: Request, res: Response) => {
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

    return res.json({
      success: true,
      data: skills,
      meta: {
        count: skills.length
      }
    });
  } catch (error) {
    console.error("[GET /api/vacancies/skills] Ошибка:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Ошибка сервера при получении списка навыков",
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
}) as unknown as RequestHandler);

// Используем RequestHandler для правильной типизации обработчиков маршрутов
router.get("/", validateQuery(SkillsQuerySchema), (async (req: Request, res: Response) => {
  console.log("[GET /api/vacancies] Запрос получен");
  // Здесь query уже валидирована благодаря middleware
  const { limit, page, skills } = req.query as z.infer<typeof SkillsQuerySchema>;

  const query: any = {};
  if (skills) {
    query.skills = { $in: skills.split(",").map((s) => s.trim()) };
  }

  try {
    console.log("[GET /api/vacancies] Начинаем запрос к БД с query:", query);
    const total = await Vacancy.countDocuments(query);
    console.log(`[GET /api/vacancies] Найдено total: ${total}`);
    const vacancies = await Vacancy.find(query)
      .limit(limit)
      .skip(page * limit)
      .sort({ publishedAt: -1 })
      .lean<VacancyDTO[]>();
    console.log(`[GET /api/vacancies] Получено вакансий из БД: ${vacancies.length}`);

    // Валидируем вакансии через Zod
    const validatedVacancies = vacancies.map(vacancy => {
      // Преобразуем ObjectId в строку
      const vacancyWithStringId = {
        ...vacancy,
        _id: vacancy._id.toString()
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

    return res.json({
      success: true,
      data: validatedVacancies,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit) - 1,
        hasPrevPage: page > 0
      }
    });
  } catch (error) {
    console.error("[GET /api/vacancies] Ошибка в блоке try/catch:", error);
    console.log("[GET /api/vacancies] Отправка ответа 500...");
    return res.status(500).json({ 
      success: false, 
      error: {
        code: 500,
        message: "Ошибка сервера при получении вакансий",
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
}) as unknown as RequestHandler);

router.get("/:id", validateParams(IdParamSchema), (async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const vacancy = await Vacancy.findById(id).lean<VacancyDTO>();

    if (!vacancy) {
      console.log(`[GET /vacancies/${id}] Вакансия не найдена`);
      return res.status(404).json({
        success: false,
        error: {
          code: 404,
          message: "Вакансия не найдена"
        }
      });
    }

    // Преобразуем _id из ObjectId в строку
    const vacancyWithStringId = {
      ...vacancy,
      _id: vacancy._id.toString()
    };
    
    // Валидируем вакансию через Zod
    const result = VacancyDTOSchema.safeParse(vacancyWithStringId);
    
    if (!result.success) {
      console.warn(`[GET /vacancies/${id}] Невалидная вакансия:`, result.error);
      // В случае проблем с форматом данных пытаемся исправить их
      return res.json({
        success: true,
        data: {
          ...vacancyWithStringId,
          skills: Array.isArray(vacancy.skills) ? vacancy.skills : [],
          publishedAt: vacancy.publishedAt instanceof Date ? 
            vacancy.publishedAt : new Date(vacancy.publishedAt || Date.now())
        }
      });
    }
    
    console.log(`[GET /vacancies/${id}] Вакансия найдена:`, result.data.title);
    return res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error(`Ошибка при получении вакансии ${id}:`, error);
    return res.status(500).json({ 
      success: false, 
      error: {
        code: 500,
        message: `Ошибка сервера при получении вакансии ${id}`,
        details: error instanceof Error ? error.message : undefined
      }
    });
  }
}) as unknown as RequestHandler);

export default router;
