import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { VacancyDTO } from "@jspulse/shared";
import { fetchVacanciesServer, fetchSkillsServer } from "$lib/services/vacancy.server";
import { logger } from "$lib/utils/logger.js";

interface HomePageData {
  initialVacancies: (VacancyDTO & { htmlDescription?: string })[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  availableSkills: string[];
  error?: string;
}

const CONTEXT = '+page.server.ts';

export const load: PageServerLoad<HomePageData> = async ({ fetch: _fetch }) => {
  const initialLimit = 10;
  const initialPage = 0;

  try {
    logger.info(CONTEXT, "Загружаем вакансии и навыки...");

    // Инициализируем DOMPurify для санитизации HTML
    const { JSDOM } = await import("jsdom");
    const DOMPurifyModule = await import("dompurify");
    const DOMPurify = DOMPurifyModule.default || DOMPurifyModule;

    const window = new JSDOM("").window;
    const purify = DOMPurify(window);
    const sanitizeHtml = (html: string) => purify.sanitize(html);

    // Загружаем вакансии с помощью нового сервиса
    const { vacancies, total, page, limit, totalPages } = await fetchVacanciesServer(
      _fetch,
      { limit: initialLimit, page: initialPage },
      sanitizeHtml
    );

    logger.debug(CONTEXT, `Извлечено вакансий: ${vacancies.length}, всего: ${total}`);

    // Загружаем навыки через сервис, используя полученные вакансии как fallback
    const availableSkills = await fetchSkillsServer(_fetch, vacancies);
    logger.debug(CONTEXT, `Получено ${availableSkills.length} навыков`);

    return {
      initialVacancies: vacancies,
      totalCount: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      availableSkills: availableSkills,
    };
  } catch (err) {
    logger.error(CONTEXT, "Общая ошибка загрузки данных:", err);

    const message =
      err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : "Не удалось загрузить данные вакансий";

    if (err instanceof Error && err.message.includes("API не вернуло ожидаемые данные")) {
      error(500, message);
    }

    return {
      initialVacancies: [],
      totalCount: 0,
      page: 0,
      limit: initialLimit,
      totalPages: 0,
      availableSkills: [],
      error: message,
    };
  }
};
