import ky, { HTTPError as KyHTTPError } from "ky";

/**
 * Создает и настраивает экземпляр ky для выполнения HTTP-запросов к API бэкенда.
 * Предназначен для использования на КЛИЕНТЕ (в браузере).
 *
 * @returns Настроенный экземпляр ky для работы с API.
 */
function createApiClient() {
  // В браузере используем VITE_PUBLIC_BACKEND_URL с fallback на localhost в dev
  const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    console.warn("[http.client] VITE_PUBLIC_BACKEND_URL не задан, используем localhost:3001");
  }
  const baseUrl = backendUrl || "http://localhost:3001";

  console.log(`[http.client] Создание клиента API для ${baseUrl}`);

  const client = ky.create({
    prefixUrl: baseUrl,
    timeout: 30000,
    retry: {
      limit: 2,
      methods: ["get"],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
    },
    hooks: {
      beforeRequest: [
        (request) => {
          console.log(`[http.client] Отправка запроса: ${request.method} ${request.url}`);
        },
      ],
      afterResponse: [
        (_request, _options, response) => {
          console.log(`[http.client] Получен ответ: ${response.status} ${response.url}`);
          return response;
        },
      ],
      beforeError: [
        (error) => {
          console.error(`[http.client] Ошибка запроса:`, {
            message: error.message,
            name: error.name,
            status: error.response?.status,
            url: error.request.url,
          });
          return error;
        },
      ],
    },
  });

  return client;
}

// Экспортируем настроенный экземпляр клиента для использования в приложении
const apiClient = createApiClient();

export { apiClient, KyHTTPError as HTTPError };
