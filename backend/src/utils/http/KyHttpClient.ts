import ky from "ky";
import type { Options as KyOptions } from "ky";
import { HttpClient, HttpRequestOptions } from "./HttpClient.js";

/**
 * Адаптер для библиотеки ky, реализующий интерфейс HttpClient
 */
export class KyHttpClient implements HttpClient {
  private baseUrl: string;
  private defaultOptions: KyOptions;

  /**
   * Создает экземпляр KyHttpClient
   * @param baseUrl Базовый URL для всех запросов
   * @param defaultOptions Опции по умолчанию для ky
   */
  constructor(baseUrl: string = "", defaultOptions: KyOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      retry: 1,
      timeout: 30000,
      hooks: {
        beforeRequest: [],
        afterResponse: [],
      },
      ...defaultOptions,
    };
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
   * Обрабатывает случаи, когда url уже содержит протокол
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
   * Выполняет HTTP-запрос через ky
   */
  private async request<T>(
    method: string,
    url: string,
    options?: KyOptions
  ): Promise<T> {
    try {
      const fullUrl = this.buildFullUrl(url);
      const response = await ky(fullUrl, {
        method,
        ...options,
      });

      return await response.json();
    } catch (error) {
      // Здесь можно добавить обработку ошибок, логирование и т.д.
      console.error(`[HTTP ${method}] Ошибка запроса ${url}:`, error);
      throw error;
    }
  }

  async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("GET", url, this.mapOptions(options));
  }

  async post<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("POST", url, this.mapOptions(options, body));
  }

  async put<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("PUT", url, this.mapOptions(options, body));
  }

  async patch<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("PATCH", url, this.mapOptions(options, body));
  }

  async delete<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>("DELETE", url, this.mapOptions(options));
  }
} 