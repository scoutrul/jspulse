import { error } from "@sveltejs/kit";
import type { PageServerLoadEvent } from "./$types";
// import { apiClient } from "$lib/api/http.client"; // Используем $lib для удобного импорта - не используем клиентский
import type { VacancyDTO } from "@jspulse/shared";
import ky, { HTTPError } from "ky"; // <-- Импортируем ky и HTTPError

// Ожидаемая структура ответа для одной вакансии
interface ApiSingleResponse {
  status: string;
  message: string;
  data: VacancyDTO | null; // Может быть null, если не найдено
}

export async function load({ params }: PageServerLoadEvent) {
  const { id } = params;
  const endpoint = `api/vacancies/${id}`;
  // ВАЖНО: На сервере нужно использовать абсолютный URL к API
  // TODO: Получить VITE_API_URL из переменных окружения на сервере (через $env/static/private?)
  const apiUrl = process.env.VITE_API_URL || "http://localhost:3001"; // Пример, нужно улучшить

  try {
    // Используем ky для запроса
    const responseData = await ky.get(`${apiUrl}/${endpoint}`).json<ApiSingleResponse>();

    if (responseData?.status !== "OK" || !responseData.data) {
      console.error(`Некорректный ответ API для вакансии ${id}:`, responseData);
      error(500, { message: "Некорректный ответ от API" });
    }

    return {
      vacancy: responseData.data,
    };
  } catch (err) {
    console.error(`Ошибка при загрузке вакансии ${id}:`, err);
    // Обработка ошибок ky
    if (err instanceof HTTPError) {
      if (err.response.status === 404) {
        error(404, { message: `Вакансия с ID ${id} не найдена` });
      }
      // Другие HTTP ошибки
      const errorText = await err.response.text();
      console.error(`Ответ сервера при ошибке (${err.response.status}):`, errorText.slice(0, 500));
      error(err.response.status, {
        message: `Ошибка сервера при загрузке вакансии: ${err.message}`,
      });
    } else if (err instanceof Error) {
      // Не HTTP ошибки (например, ошибка сети, DNS)
      error(500, { message: `Внутренняя ошибка: ${err.message}` });
    }
    // Непредвиденные ошибки
    error(500, { message: "Непредвиденная ошибка при загрузке данных" });
  }
}
