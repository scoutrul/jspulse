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

  console.log(`Backend Base URL: ${baseUrl}`);

  // Базовые настройки для всех запросов
  const baseOptions = {
    prefixUrl: baseUrl,
    headers: {
      "Content-Type": "application/json"
    },
    timeout: 30000,
    retry: {
      limit: 2,
      methods: ["get"],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
    }
  };

  console.log(`Base Ky Options:`, baseOptions);

  const client = ky.create({
    ...baseOptions,
    hooks: {
      beforeRequest: [
        (request) => {
          console.log(`Sending request: ${request.method} ${request.url}`);
        },
      ],
      afterResponse: [
        (_request, _options, response) => {
          // Логирование только для успешных ответов
          if (response.ok) {
            console.log(`Response received: ${response.status} ${response.url}`);
          }
          return response;
        },
      ],
      beforeError: [
        (error) => {
          console.error(`Client-side API Error:`, error);
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
