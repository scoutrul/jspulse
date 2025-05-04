import { HttpClient } from "./HttpClient.js";
import { KyHttpClient } from "./KyHttpClient.js";
import { LoggingHttpClient } from "./LoggingHttpClient.js";
import { CachingHttpClient } from "./CachingHttpClient.js";

/**
 * Настройки для создания HTTP-клиента
 */
interface HttpClientOptions {
  baseUrl?: string;
  logging?: boolean;
  caching?: boolean | {
    ttl: number;
    maxSize?: number;
  };
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  retry?: number;
}

/**
 * Создает HTTP-клиент с указанными настройками
 * @param options Настройки клиента
 */
export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const {
    baseUrl = "",
    logging = process.env.NODE_ENV !== "production",
    caching = false,
    defaultHeaders = {},
    timeout = 30000,
    retry = 2
  } = options;

  // Создаем базовый клиент на основе ky
  let httpClient: HttpClient = new KyHttpClient(baseUrl, {
    headers: defaultHeaders,
    timeout,
    retry
  });

  // Если нужно логирование, оборачиваем в декоратор
  if (logging) {
    httpClient = new LoggingHttpClient(httpClient);
  }

  // Если нужно кэширование, добавляем декоратор
  if (caching) {
    const cachingOptions = typeof caching === 'boolean'
      ? { ttl: 60000 } // По умолчанию 1 минута
      : caching;

    httpClient = new CachingHttpClient(httpClient, cachingOptions);
  }

  // Здесь можно добавить другие декораторы при необходимости
  // Например, для кэширования, ретраев, авторизации и т.д.

  return httpClient;
}

/**
 * Создает и возвращает HTTP-клиент для бэкенда по умолчанию
 */
export const defaultHttpClient = createHttpClient({
  timeout: 30000,
  retry: 2,
  defaultHeaders: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
}); 