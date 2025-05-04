import ky, { Options as KyOptions } from "ky-universal";
import { HttpClient, HttpRequestOptions } from "./HttpClient";

/**
 * Реализация HttpClient с использованием ky-universal для серверного рендеринга
 */
export class KyServerClient implements HttpClient {
  private baseUrl: string;
  private defaultOptions: KyOptions;

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
      const fullUrl = this.baseUrl ? new URL(url, this.baseUrl).toString() : url;
      const response = await ky(fullUrl, {
        method,
        ...options,
      });

      return await response.json();
    } catch (error) {
      console.error(`[HTTP SERVER ${method}] Ошибка запроса ${url}:`, error);
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