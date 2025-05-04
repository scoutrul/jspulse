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
 * Интерфейс для HTTP-клиентов
 * Определяет стандартный набор методов для работы с HTTP
 */
export interface HttpClient {
  /**
   * GET-запрос
   * @param url URL-адрес
   * @param options Опции запроса
   */
  get<T>(url: string, options?: HttpRequestOptions): Promise<T>;

  /**
   * POST-запрос
   * @param url URL-адрес
   * @param body Тело запроса
   * @param options Опции запроса
   */
  post<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;

  /**
   * PUT-запрос
   * @param url URL-адрес
   * @param body Тело запроса
   * @param options Опции запроса
   */
  put<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;

  /**
   * PATCH-запрос
   * @param url URL-адрес
   * @param body Тело запроса
   * @param options Опции запроса
   */
  patch<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;

  /**
   * DELETE-запрос
   * @param url URL-адрес
   * @param options Опции запроса
   */
  delete<T>(url: string, options?: HttpRequestOptions): Promise<T>;
} 