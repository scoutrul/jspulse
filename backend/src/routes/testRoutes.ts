import express, { Request, Response, Router } from "express";
import { Vacancy } from "../models/Vacancy.js";
import { VacancyDTOSchema, VacancyDTO } from "@jspulse/shared";

const router: Router = express.Router();

// Тестовый эндпоинт для прямой пагинации (без middleware)
router.get("/pagination", async (req: Request, res: Response) => {
  console.log("[GET /api/test/pagination] Запрос получен");
  console.log("[GET /api/test/pagination] Query параметры:", req.query);

  // Прямое получение параметров из строки запроса
  const pageRaw = req.query.page;
  const limitRaw = req.query.limit;
  const skills = req.query.skills;

  // Явное преобразование в числа
  const pageNum = pageRaw ? parseInt(pageRaw.toString(), 10) : 0;
  const limitNum = limitRaw ? parseInt(limitRaw.toString(), 10) : 10;

  console.log(`[GET /api/test/pagination] Обработанные параметры: page=${pageNum} (${typeof pageNum}), limit=${limitNum} (${typeof limitNum})`);

  const query: any = {};
  if (skills) {
    // Обрабатываем любой формат skills - как строку, так и массив
    const skillsArray = Array.isArray(skills)
      ? skills
      : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : []);

    if (skillsArray.length > 0) {
      console.log("[GET /api/test/pagination] Фильтрация по навыкам:", skillsArray);
      query.skills = { $in: skillsArray };
    }
  }

  try {
    console.log("[GET /api/test/pagination] Начинаем запрос к БД с query:", query);
    const total = await Vacancy.countDocuments(query);
    console.log(`[GET /api/test/pagination] Найдено total: ${total}`);

    // Рассчитываем offset для пропуска записей
    const offset = pageNum * limitNum;
    console.log(`[GET /api/test/pagination] Используем offset=${offset} (page=${pageNum} * limit=${limitNum})`);

    const vacancies = await Vacancy.find(query)
      .limit(limitNum)
      .skip(offset)
      .sort({ publishedAt: -1 })
      .lean() as VacancyDTO[];
    console.log(`[GET /api/test/pagination] Получено вакансий из БД: ${vacancies.length}`);

    // Валидируем вакансии через Zod
    const validatedVacancies = vacancies.map((vacancy: any) => {
      // Преобразуем ObjectId в строку
      const vacancyWithStringId = {
        ...vacancy,
        _id: vacancy._id ? vacancy._id.toString() : ''
      };

      // Валидируем через схему
      const result = VacancyDTOSchema.safeParse(vacancyWithStringId);

      // Если невалидно, логируем и возвращаем исправленную версию
      if (!result.success) {
        console.warn(`[GET /api/test/pagination] Невалидная вакансия ${vacancy._id}:`, result.error);
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
        page: pageNum,
        limit: limitNum,
        totalItems: total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum) - 1,
        hasPrevPage: pageNum > 0
      }
    });
  } catch (error) {
    console.error("[GET /api/test/pagination] Ошибка в блоке try/catch:", error);
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

export default router; 