import ky, { type Options as KyOptions } from "ky";
import type { HttpClient, HttpRequestOptions } from "./HttpClient";
import { logger } from "$lib/utils/logger.js";

/**
 * Реализация HttpClient с использованием ky для серверного рендеринга
 */
export class KyServerClient implements HttpClient {
  private kyInstance: typeof ky;
  private readonly CONTEXT = 'KyServerClient';

  constructor(
    private baseUrl: string,
    private options: KyOptions = {},
    private customFetch?: typeof globalThis.fetch
  ) {
    // Убеждаемся, что baseUrl заканчивается слешем для корректной работы с prefixUrl
    const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

    this.kyInstance = ky.create({
      prefixUrl: normalizedBaseUrl,
      ...options,
      fetch: customFetch,
    });
  }

  async get<T = any>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    try {
      const { headers = {}, params = {} } = options;

      // Формируем URL с параметрами, если они есть
      const urlWithParams = this.buildUrlWithParams(url, params);

      logger.debug(this.CONTEXT, `Выполняем запрос к: ${this.baseUrl}${urlWithParams}`);

      const response = await this.kyInstance(urlWithParams, {
        method: "GET",
        headers,
      }).json<T>();

      return response;
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка GET запроса к ${url}:`, error);
      throw error;
    }
  }

  async post<T = any>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    try {
      const { headers = {}, params = {}, data } = options;

      // Формируем URL с параметрами, если они есть
      const urlWithParams = this.buildUrlWithParams(url, params);

      logger.debug(this.CONTEXT, `Выполняем POST запрос к: ${this.baseUrl}${urlWithParams}`);

      const response = await this.kyInstance(urlWithParams, {
        method: "POST",
        headers,
        json: data,
      }).json<T>();

      return response;
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка POST запроса к ${url}:`, error);
      throw error;
    }
  }

  // Вспомогательный метод для добавления параметров к URL
  private buildUrlWithParams(url: string, params: Record<string, string> = {}): string {
    // Удаляем начальный слеш, если он есть (требование библиотеки ky при использовании prefixUrl)
    const normalizedUrl = url.startsWith('/') ? url.substring(1) : url;

    const searchParams = new URLSearchParams();

    // Добавляем параметры в URLSearchParams
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });

    const queryString = searchParams.toString();

    // Если параметры есть, добавляем их к URL
    if (queryString) {
      // Проверяем, содержит ли URL уже параметры
      return normalizedUrl.includes('?')
        ? `${normalizedUrl}&${queryString}`
        : `${normalizedUrl}?${queryString}`;
    }

    return normalizedUrl;
  }

  // Реализация оставшихся методов интерфейса HttpClient:
  async put<T = any>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    try {
      const { headers = {}, params = {}, data } = options;
      const urlWithParams = this.buildUrlWithParams(url, params);

      logger.debug(this.CONTEXT, `Выполняем PUT запрос к: ${this.baseUrl}${urlWithParams}`);

      const response = await this.kyInstance(urlWithParams, {
        method: "PUT",
        headers,
        json: data,
      }).json<T>();

      return response;
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка PUT запроса к ${url}:`, error);
      throw error;
    }
  }

  async patch<T = any>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    try {
      const { headers = {}, params = {}, data } = options;
      const urlWithParams = this.buildUrlWithParams(url, params);

      logger.debug(this.CONTEXT, `Выполняем PATCH запрос к: ${this.baseUrl}${urlWithParams}`);

      const response = await this.kyInstance(urlWithParams, {
        method: "PATCH",
        headers,
        json: data,
      }).json<T>();

      return response;
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка PATCH запроса к ${url}:`, error);
      throw error;
    }
  }

  async delete<T = any>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    try {
      const { headers = {}, params = {} } = options;
      const urlWithParams = this.buildUrlWithParams(url, params);

      logger.debug(this.CONTEXT, `Выполняем DELETE запрос к: ${this.baseUrl}${urlWithParams}`);

      const response = await this.kyInstance(urlWithParams, {
        method: "DELETE",
        headers,
      }).json<T>();

      return response;
    } catch (error) {
      logger.error(this.CONTEXT, `Ошибка DELETE запроса к ${url}:`, error);
      throw error;
    }
  }
} 