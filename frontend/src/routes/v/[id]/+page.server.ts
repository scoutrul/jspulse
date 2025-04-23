import { error } from "@sveltejs/kit";
import type { PageServerLoadEvent } from "./$types";
import type { VacancyApiResponse } from "@jspulse/shared";
import ky, { HTTPError } from "ky";
import { env } from '$env/dynamic/private';

export async function load({ params }: PageServerLoadEvent) {
  const { id } = params;
  const endpoint = `api/vacancies/${id}`;

  const apiUrl = env.INTERNAL_API_URL;

  if (!apiUrl) {
    console.error("FATAL: INTERNAL_API_URL is not defined in environment variables.");
    error(500, { message: "Не настроен URL внутреннего API" });
  }

  try {
    const responseData = await ky.get(`${apiUrl}/${endpoint}`).json<VacancyApiResponse>();

    if (responseData?.status !== "OK" || responseData.data === null || responseData.data === undefined) {
        // Ситуация: API вернул 200 ОК, но data: null (не должно быть при 404 от бэка)
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
     console.error(`Ошибка при загрузке вакансии ${id}:`, err);
     if (err instanceof HTTPError) {
        const status = err.response.status;
        const errorText = await err.response.text();
        console.error(`Ответ сервера при ошибке (${status}):`, errorText.slice(0, 500));
        if (status === 404) {
          error(404, { message: `Вакансия с ID ${id} не найдена` });
        }
        error(status, { message: `Ошибка сервера при загрузке вакансии: ${err.message}` });
     } else if (err instanceof Error) {
       // Не HTTP ошибки (например, ошибка сети, DNS)
       error(500, { message: `Внутренняя ошибка: ${err.message}` });
     }
     error(500, { message: "Непредвиденная ошибка при загрузке данных" });
  }
}
