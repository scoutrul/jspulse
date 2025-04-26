import express, { Request, Response } from "express";
import { Vacancy } from "../models/Vacancy.js";
import { isValidObjectId } from "mongoose";
// import { connectDB } from "../config/db.js"; // Временно комментируем
import type { PaginatedVacanciesResponse, VacancyDTO, ApiSingleResponse } from "@jspulse/shared";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  console.log("[GET /api/vacancies] Запрос получен");
  const { limit = 10, page = 0, skills } = req.query;
  const numLimit = parseInt(limit as string, 10);
  const numPage = parseInt(page as string, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const responseData: PaginatedVacanciesResponse["data"] = {
      items: vacancies.map((doc) => {
        const { _id, ...rest } = doc;
        return {
          ...rest,
          _id: _id.toString(),
          publishedAt: doc.publishedAt,
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
    res.json(apiResponse);
  } catch (error) {
    console.error("[GET /api/vacancies] Ошибка в блоке try/catch:", error);
    console.log("[GET /api/vacancies] Отправка ответа 500...");
    res.status(500).json({ status: "ERROR", message: "Ошибка сервера при получении вакансий" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
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
    } else {
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
      res.json(response);
    }
  } catch (error) {
    console.error(`Ошибка при получении вакансии ${id}:`, error);
    res
      .status(500)
      .json({ status: "ERROR", message: `Ошибка сервера при получении вакансии ${id}` });
  }
});

export default router;
