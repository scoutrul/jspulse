import { error } from "@sveltejs/kit";
// import { apiClient, HTTPError } from "../../api/http.client"; // Больше не используем apiClient здесь
import { HTTPError as KyHTTPError } from "ky"; // Импортируем тип ошибки, если он нужен

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
  // Получаем внутренний URL бэкенда из переменных окружения Node.js (доступных на сервере)
  const internalBackendUrl = process.env.INTERNAL_BACKEND_URL;

  if (!internalBackendUrl) {
    const errorMsg = "FATAL: Переменная окружения INTERNAL_BACKEND_URL не найдена на сервере!";
    console.error(errorMsg);
    error(500, { message: errorMsg });
  }

  // Формируем полный URL
  const fullUrl = `${internalBackendUrl}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1"); // Убираем двойные слеши, кроме как в http://

  console.log(`[fetchApiData Server] Запрос данных с эндпоинта: ${fullUrl}`);

  try {
    const response = await fetchFn(fullUrl); // Используем fetchFn с полным URL

    if (!response.ok) {
      // Обрабатываем HTTP ошибки
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
    // Обрабатываем сетевые или другие ошибки fetch
    console.error(`[fetchApiData Server] Ошибка при запросе к ${fullUrl}:`, err);
    if (err instanceof Error) {
      error(500, { message: `Внутренняя ошибка при запросе к ${fullUrl}: ${err.message}` });
    } else {
      error(500, { message: `Непредвиденная ошибка при запросе к ${fullUrl}` });
    }
  }
}

// Экспортируем тип ошибки Ky, если он используется где-то еще,
// но основная функция теперь не зависит от apiClient
export { fetchApiData, KyHTTPError as HTTPError };
