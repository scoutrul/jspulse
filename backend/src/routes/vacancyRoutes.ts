import express, { Request, Response, Router, RequestHandler } from "express";
import { Vacancy } from "../models/Vacancy.js";
import { isValidObjectId } from "mongoose";
import type { PaginatedVacanciesResponse, VacancyDTO, ApiSingleResponse } from "@jspulse/shared";

const router: Router = express.Router();

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
      status: "OK",
      data: skills,
      message: `Найдено ${skills.length} навыков`,
    });
  } catch (error) {
    console.error("[GET /api/vacancies/skills] Ошибка:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Ошибка сервера при получении списка навыков",
    });
  }
}) as unknown as RequestHandler);

// Используем RequestHandler для правильной типизации обработчиков маршрутов
router.get("/", (async (req: Request, res: Response) => {
  console.log("[GET /api/vacancies] Запрос получен");
  const { limit = 10, page = 0, skills } = req.query;
  const numLimit = parseInt(limit as string, 10);
  const numPage = parseInt(page as string, 10);

  const query: any = {};
  if (skills) {
    query.skills = { $in: (skills as string).split(",").map((s) => s.trim()) };
  }

  try {
    console.log("[GET /api/vacancies] Начинаем запрос к БД с query:", query);
    const total = await Vacancy.countDocuments(query);
    console.log(`[GET /api/vacancies] Найдено total: ${total}`);
    const vacancies = await Vacancy.find(query)
      .limit(numLimit)
      .skip(numPage * numLimit)
      .sort({ publishedAt: -1 })
      .lean<VacancyDTO[]>();
    console.log(`[GET /api/vacancies] Получено вакансий из БД: ${vacancies.length}`);

    // Если нашли вакансии, но не получили skills для фильтрации, логируем это
    if (vacancies.length > 0) {
      const hasSkills = vacancies.every(
        (v) => v.skills && Array.isArray(v.skills) && v.skills.length > 0
      );
      if (!hasSkills) {
        console.warn(
          "[GET /api/vacancies] Внимание: некоторые вакансии не имеют skills для фильтрации"
        );
      }
    }

    const responseData: PaginatedVacanciesResponse["data"] = {
      items: vacancies.map((doc) => {
        const { _id, ...rest } = doc;
        return {
          ...rest,
          _id: _id.toString(),
          publishedAt: doc.publishedAt,
          // Гарантируем, что skills всегда будет массивом
          skills: doc.skills && Array.isArray(doc.skills) ? doc.skills : [],
        };
      }),
      total,
      page: numPage,
      limit: numLimit,
      totalPages: Math.ceil(total / numLimit),
    };

    const apiResponse: PaginatedVacanciesResponse = {
      status: "OK",
      data: responseData,
    };

    console.log("[GET /api/vacancies] Успешно сформирован ответ");
    return res.json(apiResponse);
  } catch (error) {
    console.error("[GET /api/vacancies] Ошибка в блоке try/catch:", error);
    console.log("[GET /api/vacancies] Отправка ответа 500...");
    return res
      .status(500)
      .json({ status: "ERROR", message: "Ошибка сервера при получении вакансий" });
  }
}) as unknown as RequestHandler);

router.get("/:id", (async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ status: "ERROR", message: "Некорректный ID вакансии" });
  }

  try {
    const vacancy = await Vacancy.findById(id).lean<VacancyDTO>();

    let response: ApiSingleResponse<VacancyDTO>;

    if (!vacancy) {
      response = {
        status: "OK",
        data: null,
        message: "Вакансия не найдена",
      };
      console.log(`[GET /vacancies/${id}] Вакансия не найдена`);
      return res.status(200).json(response);
    }

    const { _id, ...rest } = vacancy;
    response = {
      status: "OK",
      data: {
        ...rest,
        _id: _id.toString(),
        publishedAt: vacancy.publishedAt,
      },
      message: "Вакансия найдена",
    };
    console.log(`[GET /vacancies/${id}] Вакансия найдена:`, response.data?.title);
    return res.json(response);
  } catch (error) {
    console.error(`Ошибка при получении вакансии ${id}:`, error);
    return res
      .status(500)
      .json({ status: "ERROR", message: `Ошибка сервера при получении вакансии ${id}` });
  }
}) as unknown as RequestHandler);

export default router;
