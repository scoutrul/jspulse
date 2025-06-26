import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { fetchVacancyByIdServer } from "$lib/services/vacancy.server";
import { logger } from "$lib/utils/logger";
const CONTEXT = "[VacancyPage] +page.server.ts";

export const load: PageServerLoad = async ({ params, fetch }) => {
  const id = params.id;

  logger.info(CONTEXT, `Запрос вакансии с ID: ${id}`);

  try {
    const response = await fetchVacancyByIdServer(fetch, id);

    if (!response) {
      logger.warn(CONTEXT, `Вакансия с ID ${id} не найдена`);
      throw error(404, 'Вакансия не найдена');
    }

    const { vacancy, isArchived } = response;
    logger.info(CONTEXT, `Вакансия загружена: ${vacancy.title} (архивная: ${isArchived})`);

    return {
      vacancy,
      isArchived
    };
  } catch (err) {
    logger.error(CONTEXT, `Ошибка при загрузке вакансии ${id}:`, err);

    if (err instanceof Response) {
      throw err;
    }

    throw error(500, 'Ошибка при загрузке вакансии');
  }
};
