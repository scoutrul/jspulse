import ky from "ky";
import type { HttpClient, HttpRequestOptions } from "./HttpClient";

/**
 * Реализация HttpClient с использованием ky для серверного рендеринга
 */
export class KyServerClient implements HttpClient {
  private baseUrl: string;
  private defaultOptions: any; // Используем any для опций, так как типы могут отличаться от клиентской версии
  private kyInstance: typeof ky;

  constructor(baseUrl: string = "", defaultOptions: any = {}, fetchInstance?: typeof globalThis.fetch) {
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
    
    // Создаем экземпляр ky с нужным fetch
    this.kyInstance = fetchInstance 
      ? ky.create({ fetch: fetchInstance }) 
      : ky;
  }

  private mapOptions(options?: HttpRequestOptions, body?: unknown): any {
    if (!options && !body) return this.defaultOptions;

    const kyOptions: any = { ...this.defaultOptions };

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
    options?: any
  ): Promise<T> {
    try {
      let fullUrl = url;
      
      // Проверяем, является ли URL абсолютным
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Если baseUrl указан, используем его как основу
        if (this.baseUrl) {
          fullUrl = new URL(url, this.baseUrl).toString();
        } else {
          // Без baseUrl нужно добавить абсолютный путь
          fullUrl = `http://localhost:3001/${url.startsWith('/') ? url.substring(1) : url}`;
        }
      }
      
      console.log(`[KyServerClient] Выполняем запрос к: ${fullUrl}`);
      
      const response = await this.kyInstance(fullUrl, {
        method,
        ...options,
      });

      return await response.json();
    } catch (error: any) {
      console.error(`[HTTP SERVER ${method}] Ошибка запроса ${url}:`, error);
      
      // Проверяем, имеет ли ошибка response (для ky ошибки HTTP могут иметь response)
      if (error.response) {
        try {
          // Пытаемся получить JSON из ответа ошибки
          const errorData = await error.response.json();
          return errorData as T; // Возвращаем ответ с ошибкой как структуру API
        } catch (jsonError) {
          // Если нельзя распарсить JSON, создаем ошибочный ответ
          throw error;
        }
      }
      
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