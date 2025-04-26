import { error } from "@sveltejs/kit";
import type { PageServerLoadEvent } from "./$types";
import type { VacancyApiResponse } from "@jspulse/shared";
import { fetchApiData } from "$lib/utils/apiUtils";

export async function load({ params, fetch }: PageServerLoadEvent) {
  const { id } = params;
  const endpoint = `api/vacancies/${id}`;

  try {
    const responseData = await fetchApiData<VacancyApiResponse>(endpoint, fetch);

    if (
      responseData?.status !== "OK" ||
      responseData.data === null ||
      responseData.data === undefined
    ) {
      if (responseData?.status === "OK" && responseData.data === null) {
        console.warn(`[Load Vacancy ${id}] API вернул статус OK, но data = null.`);
        error(404, { message: `Вакансия с ID ${id} не найдена (API вернул null)` });
      } else {
        console.error(`Некорректный ответ API для вакансии ${id}:`, responseData);
        error(500, { message: "Некорректный ответ от API" });
      }
    }

    return {
      vacancy: responseData.data,
    };
  } catch (err) {
    console.error(`[v/${id}/+page.server.ts] Ошибка при обработке данных вакансии ${id}:`, err);

    if (err && typeof err === "object" && "status" in err && "message" in err) {
      throw err;
    }

    const message = err instanceof Error ? err.message : "Неизвестная внутренняя ошибка";
    error(500, { message: `Внутренняя ошибка при обработке вакансии ${id}: ${message}` });
  }
}
