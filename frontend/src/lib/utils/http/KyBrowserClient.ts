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

  private async request<T>(
    method: string,
    url: string,
    options?: KyOptions
  ): Promise<T> {
    try {
      let fullUrl = url;
      
      // Проверяем, является ли URL абсолютным
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Если baseUrl указан, используем его как основу
        if (this.baseUrl) {
          fullUrl = new URL(url, this.baseUrl).toString();
        } else {
          // Без baseUrl используем текущий домен
          fullUrl = `${window.location.origin}/${url.startsWith('/') ? url.substring(1) : url}`;
        }
      }
      
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