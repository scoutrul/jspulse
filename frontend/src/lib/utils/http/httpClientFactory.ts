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

  // Логгируем переменные окружения только в серверном окружении и только в режиме разработки
  if (!browser && process.env.NODE_ENV !== 'production') {
    console.log('[httpClientFactory] Env vars debug:');
    console.log('- VITE_PUBLIC_BACKEND_URL:', publicBackendUrl);
    console.log('- INTERNAL_BACKEND_URL:', internalBackendUrl);
  }

  // Определяем приоритет URL:
  // 1. Явно заданный в options.baseUrl
  // 2. Внутренний URL для Docker (INTERNAL_BACKEND_URL) в серверной среде
  // 3. Публичный URL (VITE_PUBLIC_BACKEND_URL)
  // 4. Резервный локальный адрес
  let defaultBaseUrl: string;

  // В Docker контейнере используем внутренний URL, если он задан
  if (!browser && internalBackendUrl) {
    defaultBaseUrl = internalBackendUrl;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[httpClientFactory] Using internal backend URL: ${defaultBaseUrl}`);
    }
  }
  // Для браузера или когда внутренний URL не задан, используем публичный
  else if (publicBackendUrl) {
    defaultBaseUrl = publicBackendUrl;
    if (!browser && process.env.NODE_ENV !== 'production') {
      console.log(`[httpClientFactory] Using public backend URL: ${defaultBaseUrl}`);
    }
  }
  // Резервный вариант при отсутствии переменных окружения
  else {
    // В Docker контейнере бэкенд должен быть доступен по имени сервиса
    defaultBaseUrl = browser ? "http://localhost:3001" : "http://backend:3001";
    if (!browser && process.env.NODE_ENV !== 'production') {
      console.log(`[httpClientFactory] Using fallback backend URL: ${defaultBaseUrl}`);
    }
  }

  const {
    baseUrl = defaultBaseUrl,
    defaultHeaders = {},
    timeout = 30000,
    retry = 1,
    fetch = undefined  // Опциональный fetch из SvelteKit
  } = options;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[httpClientFactory] Creating client with baseUrl: ${baseUrl}`);
  }

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