import type { HttpClient, HttpRequestOptions } from "./HttpClient";
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
  fetch?: typeof globalThis.fetch;
}

/**
 * Создает HTTP-клиент с учетом окружения (браузер или сервер)
 * @param options Настройки клиента
 */
export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  // Определяем базовый URL в зависимости от окружения и доступных переменных
  let publicBackendUrl = browser
    ? import.meta.env.VITE_PUBLIC_BACKEND_URL
    : process.env.VITE_PUBLIC_BACKEND_URL;

  let internalBackendUrl = !browser ? process.env.INTERNAL_BACKEND_URL : undefined;

  // Удалено подробное логирование переменных окружения для чистой консоли

  // Определяем приоритет URL:
  // 1. Явно заданный в options.baseUrl
  // 2. Внутренний URL для Docker (INTERNAL_BACKEND_URL) в серверной среде
  // 3. Публичный URL (VITE_PUBLIC_BACKEND_URL)
  // 4. Резервный локальный адрес
  let defaultBaseUrl: string;

  // В Docker контейнере используем внутренний URL, если он задан
  if (!browser && internalBackendUrl) {
    defaultBaseUrl = internalBackendUrl;
  }
  // Для браузера или когда внутренний URL не задан, используем публичный
  else if (publicBackendUrl) {
    defaultBaseUrl = publicBackendUrl;
  }
  // Fallback для случаев когда переменные не заданы (например, во время сборки)
  else {
    // В dev режиме всегда используем localhost
    if (process.env.NODE_ENV === 'development') {
      defaultBaseUrl = "http://localhost:3001";
    } else {
      // В production для Docker используем backend hostname
      defaultBaseUrl = browser ? "http://localhost:3001" : "http://backend:3001";
    }
    // Удалено предупреждение о fallback URL
  }

  const {
    baseUrl = defaultBaseUrl,
    defaultHeaders = {},
    timeout = 30000,
    retry = 1,
    fetch = undefined  // Опциональный fetch из SvelteKit
  } = options;

  // Удалено подробное логирование создания клиента

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
    return new KyServerClient(
      baseUrl,
      {
        headers: {
          ...defaultHeaders,
        },
        timeout,
        retry
      },
      fetch  // Передаем fetch из SvelteKit, если он предоставлен
    );
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