import { HttpClient, HttpRequestOptions } from "./HttpClient.js";

/**
 * Декоратор для логирования HTTP запросов
 * Использует паттерн "Декоратор" для добавления функциональности логирования
 */
export class LoggingHttpClient implements HttpClient {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    console.log(`[HTTP GET] ${url}`, options?.params || "");
    const startTime = Date.now();

    try {
      const response = await this.httpClient.get<T>(url, options);
      const duration = Date.now() - startTime;
      console.log(`[HTTP GET] ${url} - OK (${duration}ms)`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[HTTP GET] ${url} - ERROR (${duration}ms)`, error);
      throw error;
    }
  }

  async post<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    console.log(`[HTTP POST] ${url}`, body || "");
    const startTime = Date.now();

    try {
      const response = await this.httpClient.post<T>(url, body, options);
      const duration = Date.now() - startTime;
      console.log(`[HTTP POST] ${url} - OK (${duration}ms)`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[HTTP POST] ${url} - ERROR (${duration}ms)`, error);
      throw error;
    }
  }

  async put<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    console.log(`[HTTP PUT] ${url}`, body || "");
    const startTime = Date.now();

    try {
      const response = await this.httpClient.put<T>(url, body, options);
      const duration = Date.now() - startTime;
      console.log(`[HTTP PUT] ${url} - OK (${duration}ms)`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[HTTP PUT] ${url} - ERROR (${duration}ms)`, error);
      throw error;
    }
  }

  async patch<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    console.log(`[HTTP PATCH] ${url}`, body || "");
    const startTime = Date.now();

    try {
      const response = await this.httpClient.patch<T>(url, body, options);
      const duration = Date.now() - startTime;
      console.log(`[HTTP PATCH] ${url} - OK (${duration}ms)`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[HTTP PATCH] ${url} - ERROR (${duration}ms)`, error);
      throw error;
    }
  }

  async delete<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    console.log(`[HTTP DELETE] ${url}`);
    const startTime = Date.now();

    try {
      const response = await this.httpClient.delete<T>(url, options);
      const duration = Date.now() - startTime;
      console.log(`[HTTP DELETE] ${url} - OK (${duration}ms)`);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[HTTP DELETE] ${url} - ERROR (${duration}ms)`, error);
      throw error;
    }
  }
} 