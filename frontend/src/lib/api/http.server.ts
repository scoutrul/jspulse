import { error } from "@sveltejs/kit";
import { HTTPError as KyHTTPError } from "ky";

/**
 * Выполняет GET-запрос к API бэкенда с использованием предоставленной функции fetch.
 * Предназначена для использования на СЕРВЕРЕ (в load функциях).
 * Обрабатывает стандартные ошибки HTTP и сети, пробрасывая ошибки SvelteKit.
 *
 * @param endpoint Относительный путь API (например, 'api/vacancies?limit=10').
 * @param fetchFn Функция fetch, предоставленная SvelteKit в load.
 * @returns Promise с данными ответа API в формате JSON.
 * @throws SvelteKit HttpError в случае ошибок HTTP или сети.
 */
async function fetchApiData<TResponse>(
  endpoint: string,
  fetchFn: typeof fetch
): Promise<TResponse> {
  // На сервере используем INTERNAL_BACKEND_URL
  const internalBackendUrl = process.env.INTERNAL_BACKEND_URL;
  if (!internalBackendUrl) {
    console.warn("[http.server] INTERNAL_BACKEND_URL не задан, используем fallback");
  }
  const baseUrl = internalBackendUrl || "http://backend:3001";

  // Формируем полный URL
  const fullUrl = `${baseUrl}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");

  console.log(`[fetchApiData Server] Запрос данных с эндпоинта: ${fullUrl}`);

  try {
    const response = await fetchFn(fullUrl);

    if (!response.ok) {
      const status = response.status;
      let errorText = "Не удалось прочитать тело ответа";
      try {
        errorText = await response.text();
      } catch (readError) {
        console.error("[fetchApiData Server] Не удалось прочитать тело ошибки:", readError);
      }
      console.error(`[fetchApiData Server] Ответ сервера (${status}):`, errorText.slice(0, 500));

      if (status === 404) {
        error(404, { message: `Ресурс не найден по адресу: ${fullUrl}` });
      }
      error(status, {
        message: `Ошибка сервера (${status}) при запросе к ${fullUrl}`,
      });
    }

    const responseData = (await response.json()) as TResponse;
    console.log(`[fetchApiData Server] Получен ответ для эндпоинта: ${fullUrl}`);
    return responseData;
  } catch (err) {
    console.error(`[fetchApiData Server] Ошибка при запросе к ${fullUrl}:`, err);
    if (err instanceof Error) {
      error(500, { message: `Внутренняя ошибка при запросе к ${fullUrl}: ${err.message}` });
    } else {
      error(500, { message: `Непредвиденная ошибка при запросе к ${fullUrl}` });
    }
  }
}

export { fetchApiData, KyHTTPError as HTTPError };
