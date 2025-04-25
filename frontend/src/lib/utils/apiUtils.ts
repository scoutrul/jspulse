import { error } from "@sveltejs/kit";
import { apiClient, HTTPError } from "../../api/http.client";
import { PUBLIC_BACKEND_URL } from "$env/static/public";

/**
 * Выполняет GET-запрос к API бэкенда с использованием настроенного ky клиента.
 * Обрабатывает стандартные ошибки HTTP и сети, пробрасывая ошибки SvelteKit.
 *
 * @param endpoint Относительный путь API (без начального слеша!).
 * @returns Promise с данными ответа API в формате JSON.
 * @throws SvelteKit HttpError в случае ошибок HTTP или сети.
 */
async function fetchApiData<TResponse>(endpoint: string): Promise<TResponse> {
  if (!PUBLIC_BACKEND_URL) {
    const errorMsg =
      "FATAL: Переменная окружения PUBLIC_BACKEND_URL не найдена! Укажите ее в frontend/.env или в environment Docker-сервиса";
    console.error(errorMsg);
    error(500, { message: errorMsg });
  }

  console.log(`[fetchApiData] Запрос данных с эндпоинта: ${endpoint}`);

  try {
    const responseData = await apiClient.get(endpoint).json<TResponse>();
    console.log(`[fetchApiData] Получен ответ для эндпоинта: ${endpoint}`);
    return responseData;
  } catch (err) {
    console.error(`[fetchApiData] Ошибка при запросе к ${endpoint}:`, err);

    if (err instanceof HTTPError) {
      const status = err.response.status;
      let errorText = "Не удалось прочитать тело ответа";
      try {
        errorText = await err.response.text();
      } catch (readError) {
        console.error("[fetchApiData] Не удалось прочитать тело ошибки:", readError);
      }
      console.error(`[fetchApiData] Ответ сервера (${status}):`, errorText.slice(0, 500));

      if (status === 404) {
        error(404, { message: `Ресурс не найден по адресу: ${endpoint}` });
      }
      error(status, {
        message: `Ошибка сервера (${status}) при запросе к ${endpoint}: ${err.message}`,
      });
    } else if (err instanceof Error) {
      error(500, { message: `Внутренняя ошибка при запросе к ${endpoint}: ${err.message}` });
    } else {
      error(500, { message: `Непредвиденная ошибка при запросе к ${endpoint}` });
    }
  }
}

export { fetchApiData, HTTPError };
