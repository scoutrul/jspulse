import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { z } from "zod";
import { fetchVacancyByIdServer } from "$lib/services/vacancy.server";
import { logger } from "$lib/utils/logger.js";

// Локальное определение схем, так как в shared возникли проблемы с экспортом
const DateSchema = z.preprocess((val) => {
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return null;
}, z.date().nullable().optional());

// Базовая схема вакансии
const BaseVacancySchema = z.object({
  externalId: z.string(),
  title: z.string(),
  company: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  publishedAt: DateSchema,
  source: z.string()
});

// Схема DTO вакансии
const VacancyDTOSchema = BaseVacancySchema.extend({
  _id: z.string().optional(),
  description: z.string().nullable().optional(),
  schedule: z.string().nullable().optional(),
  skills: z.array(z.string()).default([]),
  salaryFrom: z.number().nullable().optional(),
  salaryTo: z.number().nullable().optional(),
  salaryCurrency: z.string().nullable().optional(),
  experience: z.string().nullable().optional(),
  employment: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  htmlDescription: z.string().nullable().optional()
});

const CONTEXT = 'vacancy.detail';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const id = params.id;

  logger.info(CONTEXT, `Запрос вакансии с ID: ${id}`);

  try {
    // Инициализируем DOMPurify для санитизации HTML
    const { JSDOM } = await import("jsdom");
    const DOMPurifyModule = await import("dompurify");
    const DOMPurify = DOMPurifyModule.default || DOMPurifyModule;

    const window = new JSDOM("").window;
    const purify = DOMPurify(window);
    const sanitizeHtmlFunc = (html: string) => purify.sanitize(html);

    // Получаем данные вакансии через сервисный слой
    // Уже валидировано через Zod в сервисном слое
    const vacancy = await fetchVacancyByIdServer(fetch, id, sanitizeHtmlFunc);

    // Проверяем статус ответа
    if (!vacancy) {
      logger.error(CONTEXT, `Вакансия с ID ${id} не найдена`);
      throw error(404, "Вакансия не найдена");
    }

    // Дополнительная проверка через Zod для гарантии
    const validationResult = VacancyDTOSchema.safeParse(vacancy);

    if (!validationResult.success) {
      logger.error(CONTEXT, `Ошибка валидации вакансии ${id}:`, validationResult.error);
      throw error(500, "Получены некорректные данные вакансии");
    }

    // Только в режиме разработки печатаем детальную информацию для отладки
    if (logger.isEnabled()) {
      logger.debug(CONTEXT, `Вакансия прошла валидацию: ${vacancy.title}`);
    }

    return {
      vacancy: validationResult.data
    };
  } catch (err) {
    if (err instanceof Error) {
      logger.error(CONTEXT, `Ошибка при загрузке вакансии ${id}:`, err);
      throw error(500, err.message || "Ошибка при загрузке вакансии");
    }
    throw err;
  }
};
