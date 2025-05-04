import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { VacancyDTO } from "@jspulse/shared";
import { z } from "zod";
import { fetchVacancyByIdServer } from "$lib/services/vacancy.server";
import { sanitizeHtml } from "$lib/utils/sanitizeHtml";

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

export const load: PageServerLoad = async ({ params, fetch }) => {
  const id = params.id;

  console.log(`[+page.server.ts load] Запрос вакансии с ID: ${id}`);

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
      console.error(`[+page.server.ts load] Вакансия с ID ${id} не найдена`);
      throw error(404, "Вакансия не найдена");
    }

    // Дополнительная проверка через Zod для гарантии
    const validationResult = VacancyDTOSchema.safeParse(vacancy);

    if (!validationResult.success) {
      console.error(`[+page.server.ts] Ошибка валидации вакансии ${id}:`, validationResult.error);
      throw error(500, "Получены некорректные данные вакансии");
    }

    // Печатаем детальную информацию об объекте вакансии
    console.log(`[+page.server.ts] ДЕТАЛЬНАЯ ДИАГНОСТИКА ВАКАНСИИ:`, {
      _id: vacancy._id,
      title: vacancy.title,
      publishedAt: {
        raw: vacancy.publishedAt,
        type: typeof vacancy.publishedAt,
        instanceOf: vacancy.publishedAt instanceof Date,
        isString: typeof vacancy.publishedAt === 'string',
        isDate: vacancy.publishedAt instanceof Date,
        isValid: vacancy.publishedAt instanceof Date
          ? !isNaN(vacancy.publishedAt.getTime())
          : typeof vacancy.publishedAt === 'string'
            ? !isNaN(new Date(vacancy.publishedAt).getTime())
            : false,
        asDate: new Date(vacancy.publishedAt instanceof Date
          ? vacancy.publishedAt
          : typeof vacancy.publishedAt === 'string'
            ? vacancy.publishedAt
            : 0)
      }
    });

    console.log(`[+page.server.ts] ПОСЛЕ ВАЛИДАЦИИ ДАННЫЕ:`, {
      _id: validationResult.data._id,
      title: validationResult.data.title,
      publishedAt: {
        raw: validationResult.data.publishedAt,
        type: typeof validationResult.data.publishedAt,
        instanceOf: validationResult.data.publishedAt instanceof Date,
        isValid: validationResult.data.publishedAt instanceof Date
          ? !isNaN(validationResult.data.publishedAt.getTime())
          : false,
      }
    });

    return {
      vacancy: validationResult.data
    };
  } catch (err) {
    if (err instanceof Error) {
      console.error(`[+page.server.ts load] Ошибка при загрузке вакансии ${id}:`, err);
      throw error(500, err.message || "Ошибка при загрузке вакансии");
    }
    throw err;
  }
};
