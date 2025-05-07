import ky from "ky";
import type { Options as KyOptions } from "ky";

/**
 * Опции для HTTP-запросов
 */
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
  retry?: number;
  [key: string]: unknown;
}

/**
 * Опции для создания HTTP-клиента
 */
export interface HttpClientOptions {
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
 * Запись в кэше
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Универсальный HTTP-клиент на базе библиотеки ky
 * Поддерживает логирование и кэширование запросов
 */
export class HttpClient {
  private baseUrl: string;
  private defaultOptions: KyOptions;
  private enableLogging: boolean;
  private enableCaching: boolean;
  private cache: Map<string, CacheEntry<unknown>>;
  private cacheTtl: number;
  private cacheMaxSize: number;

  /**
   * Создает экземпляр HttpClient
   */
  constructor(options: HttpClientOptions = {}) {
    const {
      baseUrl = "",
      logging = process.env.NODE_ENV !== "production",
      caching = false,
      defaultHeaders = {},
      timeout = 30000,
      retry = 2
    } = options;

    this.baseUrl = baseUrl;
    this.defaultOptions = {
      retry,
      timeout,
      headers: defaultHeaders,
      hooks: {
        beforeRequest: [],
        afterResponse: [],
      }
    };

    this.enableLogging = logging;
    this.enableCaching = Boolean(caching);

    // Настройки кэширования
    this.cache = new Map();
    this.cacheTtl = typeof caching === 'object' ? caching.ttl : 60000; // По умолчанию 1 минута
    this.cacheMaxSize = typeof caching === 'object' && caching.maxSize ? caching.maxSize : 100;
  }

  /**
   * Конвертирует наши опции в формат для ky
   */
  private mapOptions(options?: HttpRequestOptions, body?: unknown): KyOptions {
    if (!options && !body) return this.defaultOptions;

    const kyOptions: KyOptions = { ...this.defaultOptions };

    if (options?.headers) {
      kyOptions.headers = { ...kyOptions.headers, ...options.headers };
    }

    if (options?.params) {
      kyOptions.searchParams = options.params;
    }

    if (options?.timeout) {
      kyOptions.timeout = options.timeout;
    }

    if (options?.retry !== undefined) {
      kyOptions.retry = options.retry;
    }

    if (body !== undefined) {
      kyOptions.json = body;
    }

    return kyOptions;
  }

  /**
   * Безопасно объединяет базовый URL и путь запроса
   */
  private buildFullUrl(url: string): string {
    // Если url содержит протокол, возвращаем его как есть
    if (url.match(/^https?:\/\//)) {
      return url;
    }

    // Если есть baseUrl, объединяем с ним
    if (this.baseUrl) {
      // Убираем лишний слеш между baseUrl и url
      const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    }

    return url;
  }

  /**
   * Генерирует ключ для кэша
   */
  private generateCacheKey(
    method: string,
    url: string,
    options?: HttpRequestOptions
  ): string {
    // Простой генератор ключа
    const paramsKey = options?.params
      ? Object.entries(options.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => `${key}=${val}`)
        .join('&')
      : '';

    return `${method}:${url}${paramsKey ? `?${paramsKey}` : ''}`;
  }

  /**
   * Проверяет, актуальна ли запись в кэше
   */
  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < this.cacheTtl;
  }

  /**
   * Добавляет запись в кэш
   */
  private addToCache<T>(key: string, data: T): void {
    // Ограничиваем размер кэша
    if (this.cache.size >= this.cacheMaxSize) {
      // Удаляем самую старую запись
      const oldestKey = [...this.cache.entries()]
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Выполняет HTTP-запрос через ky с логированием и кэшированием
   */
  private async request<T>(
    method: string,
    url: string,
    options?: KyOptions
  ): Promise<T> {
    const fullUrl = this.buildFullUrl(url);
    const startTime = this.enableLogging ? Date.now() : 0;

    // Логируем начало запроса
    if (this.enableLogging) {
      console.log(`[HTTP ${method}] ${fullUrl}`,
        options?.searchParams || (options?.json ? options.json : ""));
    }

    try {
      // Получаем данные из кэша или выполняем запрос
      let data: T;

      // Проверяем кэш только для GET-запросов
      if (this.enableCaching && method === 'GET') {
        const cacheKey = this.generateCacheKey(method, url, options as HttpRequestOptions);
        const cachedEntry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;

        // Если есть актуальная запись в кэше, возвращаем её
        if (cachedEntry && this.isCacheValid(cachedEntry)) {
          if (this.enableLogging) {
            console.log(`[CACHE] Найден кэш для ${method} ${url}`);
          }
          return cachedEntry.data;
        }
      }

      // Выполняем запрос
      const response = await ky(fullUrl, {
        method,
        ...options,
      });

      data = await response.json();

      // Кэшируем результат для GET-запросов
      if (this.enableCaching && method === 'GET') {
        const cacheKey = this.generateCacheKey(method, url, options as HttpRequestOptions);
        this.addToCache(cacheKey, data);
      }

      // Логируем успешное завершение
      if (this.enableLogging) {
        const duration = Date.now() - startTime;
        console.log(`[HTTP ${method}] ${fullUrl} - OK (${duration}ms)`);
      }

      return data;
    } catch (error) {
      // Логируем ошибку
      if (this.enableLogging) {
        const duration = Date.now() - startTime;
        console.error(`[HTTP ${method}] ${fullUrl} - ERROR (${duration}ms)`, error);
      }
      throw error;
    }
  }

  /**
   * GET-запрос
   */
  async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("GET", url, this.mapOptions(options));
  }

  /**
   * POST-запрос
   */
  async post<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("POST", url, this.mapOptions(options, body));
  }

  /**
   * PUT-запрос
   */
  async put<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("PUT", url, this.mapOptions(options, body));
  }

  /**
   * PATCH-запрос
   */
  async patch<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("PATCH", url, this.mapOptions(options, body));
  }

  /**
   * DELETE-запрос
   */
  async delete<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("DELETE", url, this.mapOptions(options));
  }

  /**
   * Очищает весь кэш
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Инвалидирует записи в кэше, связанные с указанным URL
   */
  invalidateCache(urlPattern: string | RegExp): void {
    for (const key of this.cache.keys()) {
      if (typeof urlPattern === 'string') {
        if (key.includes(urlPattern)) {
          this.cache.delete(key);
        }
      } else if (urlPattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Создает HTTP-клиент с указанными настройками
 * @param options Настройки клиента
 */
export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  return new HttpClient(options);
}

/**
 * HTTP-клиент для бэкенда по умолчанию
 */
export const defaultHttpClient = createHttpClient({
  timeout: 30000,
  retry: 2,
  defaultHeaders: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
}); 