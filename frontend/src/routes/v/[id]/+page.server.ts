import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import type { VacancyDTO } from "@jspulse/shared";
import { fetchApiData } from "$lib/api/http.server";

export const load: PageServerLoad = async ({ params, fetch }) => {
  const { id } = params;
  const endpoint = `api/vacancies/${id}`;

  try {
    const response = await fetchApiData<VacancyDTO>(endpoint, fetch);
    return {
      vacancy: response,
    };
  } catch (err) {
    console.error(`[+page.server.ts] Ошибка при загрузке вакансии ${id}:`, err);
    throw error(500, {
      message: `Не удалось загрузить вакансию ${id}`,
    });
  }
};
