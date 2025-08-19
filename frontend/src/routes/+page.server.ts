import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { VacancyDTO, VacancyWithHtml } from "@jspulse/shared";
import { fetchVacanciesServer, fetchSkillsServer, fetchSkillsStatsServer } from "$lib/services/vacancy.server";
import { logger } from "$lib/utils/logger.js";

interface HomePageData {
  initialVacancies: VacancyWithHtml[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  availableSkills: string[];
  skillsStats: Array<{ name: string; count: number }>;
  error?: string;
}

const CONTEXT = '+page.server.ts';

export const load: PageServerLoad<HomePageData> = async ({ fetch: _fetch }) => {
  const initialLimit = 10;
  const initialPage = 0;

  try {

    logger.info(CONTEXT, "Загружаем вакансии и навыки...");

    // Простая санитизация HTML на сервере (данные от нашего API уже безопасны)
    const sanitizeHtml = (html: string) => html;


    // Загружаем вакансии с помощью нового сервиса
    const { vacancies, total, page, limit, totalPages } = await fetchVacanciesServer(
      _fetch,
      { limit: initialLimit, page: initialPage },
      sanitizeHtml
    );


    logger.debug(CONTEXT, `Извлечено вакансий: ${vacancies.length}, всего: ${total}`);

    // Загружаем навыки и статистику параллельно

    const [availableSkills, skillsStats] = await Promise.all([
      fetchSkillsServer(_fetch),
      fetchSkillsStatsServer(_fetch)
    ]);

    logger.debug(CONTEXT, `Получено ${availableSkills.length} навыков и ${skillsStats.length} статистик`);

    // Явно приводим типы, чтобы соответствовать VacancyWithHtml
    const vacanciesWithHtml: VacancyWithHtml[] = vacancies.map(vacancy => ({
      ...vacancy,
      htmlDescription: vacancy.htmlDescription || undefined // Изменяем null на undefined
    }));



    return {
      initialVacancies: vacanciesWithHtml,
      totalCount: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
      availableSkills: availableSkills,
      skillsStats: skillsStats,
    };
  } catch (err) {
    logger.error(CONTEXT, "Общая ошибка загрузки данных:", err);


    const message =
      err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : "Не удалось загрузить данные вакансий";



    // Не выбрасываем error, а возвращаем пустые данные
    return {
      initialVacancies: [],
      totalCount: 0,
      page: 0,
      limit: initialLimit,
      totalPages: 0,
      availableSkills: [],
      skillsStats: [],
      error: message,
    };
  }
};
