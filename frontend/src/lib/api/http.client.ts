import ky, { HTTPError as KyHTTPError } from "ky";

/**
 * Создает и настраивает экземпляр ky для выполнения HTTP-запросов к API бэкенда.
 * Предназначен для использования на КЛИЕНТЕ (в браузере).
 *
 * @returns Настроенный экземпляр ky для работы с API.
 */
function createApiClient() {
  // В браузере используем VITE_PUBLIC_BACKEND_URL
  const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    console.warn("[http.client] VITE_PUBLIC_BACKEND_URL не задан, используем fallback");
  }
  const baseUrl = backendUrl || "http://localhost:3001";

  console.log(`Backend Base URL: ${baseUrl}`);

  /**
   * Безопасно объединяет базовый URL и путь запроса
   */
  const buildUrl = (path: string) => {
    // Если путь уже содержит протокол, возвращаем его как есть
    if (path.match(/^https?:\/\//)) {
      return path;
    }

    // Объединяем baseUrl с путем
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  // Базовые настройки для всех запросов
  const baseOptions = {
    // Убираем prefixUrl, т.к. будем вручную строить URL
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

  // Обертка над клиентом для правильного построения URL
  return {
    get: (path: string, options?: any) => client.get(buildUrl(path), options),
    post: (path: string, options?: any) => client.post(buildUrl(path), options),
    put: (path: string, options?: any) => client.put(buildUrl(path), options),
    patch: (path: string, options?: any) => client.patch(buildUrl(path), options),
    delete: (path: string, options?: any) => client.delete(buildUrl(path), options),
    extend: (options?: any) => client.extend(options),
  };
}

// Экспортируем настроенный экземпляр клиента для использования в приложении
const apiClient = createApiClient();

export { apiClient, KyHTTPError as HTTPError };
