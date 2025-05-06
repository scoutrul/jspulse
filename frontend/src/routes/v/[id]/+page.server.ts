import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { VacancyDTOSchema } from "@jspulse/shared";
import { fetchVacancyByIdServer } from "$lib/services/vacancy.server";
import { logger } from "$lib/utils/logger.js";

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
