import { HttpClient, HttpRequestOptions } from "./HttpClient";

/**
 * Настройки кэширования
 */
interface CacheOptions {
  /**
   * Время жизни кэша в миллисекундах
   */
  ttl: number;
  
  /**
   * Максимальное количество записей в кэше
   */
  maxSize?: number;
  
  /**
   * Функция для создания ключа кэша
   */
  keyGenerator?: (method: string, url: string, options?: HttpRequestOptions, body?: unknown) => string;
}

/**
 * Запись в кэше
 */
interface CacheEntry<T> {
  /**
   * Данные
   */
  data: T;
  
  /**
   * Время создания записи
   */
  timestamp: number;
}

/**
 * Декоратор для кэширования HTTP-запросов
 * 
 * Позволяет кэшировать результаты GET-запросов для уменьшения нагрузки на API
 * и повышения производительности приложения
 */
export class CachingHttpClient implements HttpClient {
  private httpClient: HttpClient;
  private cache: Map<string, CacheEntry<unknown>>;
  private options: CacheOptions;
  
  constructor(httpClient: HttpClient, options: CacheOptions) {
    this.httpClient = httpClient;
    // Устанавливаем параметры по умолчанию и затем объединяем с пользовательскими
    const defaultOptions: CacheOptions = {
      ttl: 60000, // По умолчанию 1 минута
      maxSize: 100,
    };
    this.options = { ...defaultOptions, ...options };
    this.cache = new Map();
  }
  
  /**
   * Генерирует ключ для кэша
   */
  private generateCacheKey(
    method: string, 
    url: string, 
    options?: HttpRequestOptions, 
    body?: unknown
  ): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(method, url, options, body);
    }
    
    // Простой генератор ключа по умолчанию
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
    return Date.now() - entry.timestamp < this.options.ttl;
  }
  
  /**
   * Добавляет запись в кэш
   */
  private addToCache<T>(key: string, data: T): void {
    // Ограничиваем размер кэша
    if (this.options.maxSize && this.cache.size >= this.options.maxSize) {
      // Удаляем самую старую запись
      const oldestKey = [...this.cache.entries()]
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  /**
   * Получает данные из кэша или из HTTP-клиента
   */
  private async getWithCaching<T>(
    method: string, 
    url: string, 
    callback: () => Promise<T>,
    options?: HttpRequestOptions,
    body?: unknown
  ): Promise<T> {
    // Кэшируем только GET-запросы
    if (method !== 'GET') {
      return callback();
    }
    
    const cacheKey = this.generateCacheKey(method, url, options, body);
    const cachedEntry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;
    
    // Если есть актуальная запись в кэше, возвращаем её
    if (cachedEntry && this.isCacheValid(cachedEntry)) {
      console.log(`[CACHE] Найден кэш для ${method} ${url}`);
      return cachedEntry.data;
    }
    
    // Иначе выполняем запрос и кэшируем результат
    const data = await callback();
    this.addToCache(cacheKey, data);
    return data;
  }
  
  async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.getWithCaching<T>(
      'GET',
      url,
      () => this.httpClient.get<T>(url, options),
      options
    );
  }
  
  async post<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.httpClient.post<T>(url, body, options);
  }
  
  async put<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.httpClient.put<T>(url, body, options);
  }
  
  async patch<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.httpClient.patch<T>(url, body, options);
  }
  
  async delete<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    // После DELETE-запроса можно инвалидировать связанные с URL кэши
    // Но для этого нужна более сложная логика инвалидации
    return this.httpClient.delete<T>(url, options);
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