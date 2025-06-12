import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { VacancyDTO, VacancyWithHtml } from "@jspulse/shared";
import { fetchVacanciesServer, fetchSkillsServer } from "$lib/services/vacancy.server";
import { logger } from "$lib/utils/logger.js";

interface HomePageData {
  initialVacancies: VacancyWithHtml[];
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
    console.log("[PAGE SERVER] Начинаем загрузку данных...");
    logger.info(CONTEXT, "Загружаем вакансии и навыки...");

    // Простая санитизация HTML на сервере (данные от нашего API уже безопасны)
    const sanitizeHtml = (html: string) => html;

    console.log("[PAGE SERVER] Вызываем fetchVacanciesServer...");
    // Загружаем вакансии с помощью нового сервиса
    const { vacancies, total, page, limit, totalPages } = await fetchVacanciesServer(
      _fetch,
      { limit: initialLimit, page: initialPage },
      sanitizeHtml
    );
    console.log("[PAGE SERVER] Получено вакансий:", vacancies.length, "из", total);

    logger.debug(CONTEXT, `Извлечено вакансий: ${vacancies.length}, всего: ${total}`);

    // Загружаем навыки через сервис
    console.log("[PAGE SERVER] Загружаем навыки...");
    const availableSkills = await fetchSkillsServer(_fetch);
    console.log("[PAGE SERVER] Получено навыков:", availableSkills.length);
    logger.debug(CONTEXT, `Получено ${availableSkills.length} навыков`);

    // Явно приводим типы, чтобы соответствовать VacancyWithHtml
    const vacanciesWithHtml: VacancyWithHtml[] = vacancies.map(vacancy => ({
      ...vacancy,
      htmlDescription: vacancy.htmlDescription || undefined // Изменяем null на undefined
    }));

    console.log("[PAGE SERVER] Возвращаем данные:", {
      vacancies: vacanciesWithHtml.length,
      total,
      skills: availableSkills.length
    });

    return {
      initialVacancies: vacanciesWithHtml,
      totalCount: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      availableSkills: availableSkills,
    };
  } catch (err) {
    logger.error(CONTEXT, "Общая ошибка загрузки данных:", err);
    console.error("[PAGE SERVER] Детальная ошибка:", err);

    const message =
      err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : "Не удалось загрузить данные вакансий";

    console.error("[PAGE SERVER] Сообщение об ошибке:", message);

    // Не выбрасываем error, а возвращаем пустые данные
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
