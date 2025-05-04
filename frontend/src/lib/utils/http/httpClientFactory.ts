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
  // Определяем правильный baseUrl в зависимости от окружения
  let defaultBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  // Отладочная информация о переменных окружения
  if (!browser) {
    console.log('[httpClientFactory] Env vars debug:');
    console.log('- VITE_PUBLIC_BACKEND_URL:', process.env.VITE_PUBLIC_BACKEND_URL);
    console.log('- INTERNAL_BACKEND_URL:', process.env.INTERNAL_BACKEND_URL);
  }

  // В серверной среде проверяем наличие INTERNAL_BACKEND_URL (для Docker)
  if (!browser && process.env.INTERNAL_BACKEND_URL) {
    defaultBaseUrl = process.env.INTERNAL_BACKEND_URL;
    console.log(`[httpClientFactory] Using internal backend URL: ${defaultBaseUrl}`);
  }

  const {
    baseUrl = defaultBaseUrl,
    defaultHeaders = {},
    timeout = 30000,
    retry = 1,
    fetch = undefined  // Опциональный fetch из SvelteKit
  } = options;

  console.log(`[httpClientFactory] Creating client with baseUrl: ${baseUrl}`);

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