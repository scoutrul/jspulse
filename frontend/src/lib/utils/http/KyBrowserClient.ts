import ky from "ky";
import type { Options as KyOptions } from "ky";
import type { HttpClient, HttpRequestOptions } from "./HttpClient";

/**
 * Реализация HttpClient с использованием ky для браузера
 */
export class KyBrowserClient implements HttpClient {
  private baseUrl: string;
  private defaultOptions: KyOptions;

  constructor(baseUrl: string = "", defaultOptions: KyOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      retry: 1,
      timeout: 30000,
      credentials: "same-origin", // Изменяем на same-origin для избежания CORS проблем
      hooks: {
        beforeRequest: [],
        afterResponse: [],
      },
      ...defaultOptions,
    };
  }

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

    // Без baseUrl используем текущий домен
    const origin = window.location.origin;
    const path = url.startsWith('/') ? url.substring(1) : url;
    return `${origin}/${path}`;
  }

  private async request<T>(
    method: string,
    url: string,
    options?: KyOptions
  ): Promise<T> {
    try {
      const fullUrl = this.buildFullUrl(url);

      console.log(`[KyBrowserClient] Выполняем запрос к: ${fullUrl}`);

      const response = await ky(fullUrl, {
        method,
        ...options,
      });

      return await response.json();
    } catch (error) {
      // Здесь можно добавить обработку ошибок и трансформацию ошибок API
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