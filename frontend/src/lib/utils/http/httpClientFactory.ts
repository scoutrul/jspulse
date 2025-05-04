import { HttpClient, HttpRequestOptions } from "./HttpClient";
import { KyBrowserClient } from "./KyBrowserClient";
import { KyServerClient } from "./KyServerClient";
import { browser } from "$app/environment";

/**
 * Настройки для создания HTTP-клиента
 */
interface HttpClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retry?: number;
}

/**
 * Создает HTTP-клиент с учетом окружения (браузер или сервер)
 * @param options Настройки клиента
 */
export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const {
    baseUrl = import.meta.env.VITE_API_URL || "",
    defaultHeaders = {},
    timeout = 30000,
    retry = 1
  } = options;

  // В зависимости от окружения создаем разные клиенты
  if (browser) {
    // Клиент для браузера
    return new KyBrowserClient(baseUrl, {
      headers: {
        ...defaultHeaders,
      },
      timeout,
      retry
    });
  } else {
    // Клиент для SSR
    return new KyServerClient(baseUrl, {
      headers: {
        ...defaultHeaders,
      },
      timeout,
      retry
    });
  }
}

/**
 * Метод для создания клиента, который доступен и на клиенте, и на сервере
 */
export function createIsomorphicHttpClient(options: HttpClientOptions = {}): HttpClient {
  return createHttpClient(options);
}

/**
 * HTTP-клиент по умолчанию
 */
export const httpClient = createIsomorphicHttpClient({
  defaultHeaders: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
}); 