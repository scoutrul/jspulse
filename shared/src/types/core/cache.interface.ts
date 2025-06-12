/**
 * Базовый интерфейс для сервиса кэширования.
 * Обеспечивает единообразный API для различных стратегий кэширования
 * (in-memory, Redis, filesystem) и поддерживает TTL для автоматического истечения.
 */
export interface ICacheService {
  /**
   * Сохранение значения в кэше с опциональным TTL.
   * TTL по умолчанию определяется реализацией сервиса.
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Получение значения из кэша по ключу.
   * Возвращает null если ключ не найден или истек TTL.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Проверка существования ключа в кэше.
   * Учитывает TTL - возвращает false для истекших ключей.
   */
  has(key: string): Promise<boolean>;

  /**
   * Удаление значения из кэша по ключу.
   * Возвращает true если ключ был найден и удален.
   */
  delete(key: string): Promise<boolean>;

  /**
   * Очистка всего кэша.
   * Осторожно использовать в production окружении.
   */
  clear(): Promise<void>;

  /**
   * Получение статистики кэша.
   * Полезно для мониторинга и оптимизации.
   */
  getStats(): Promise<ICacheStats>;

  /**
   * Освобождение ресурсов и cleanup.
   * Должен вызываться при shutdown для предотвращения утечек.
   */
  destroy?(): void;
}

/**
 * Статистика работы кэша для мониторинга и оптимизации.
 * Помогает понять эффективность кэширования и выявить проблемы.
 */
export interface ICacheStats {
  // Общее количество ключей в кэше
  totalKeys: number;

  // Количество попаданий в кэш (cache hits)
  hits: number;

  // Количество промахов кэша (cache misses)
  misses: number;

  // Процент попаданий (hit rate)
  hitRate: number;

  // Размер кэша в байтах (если доступно)
  sizeBytes?: number;

  // Время работы кэша в секундах
  uptimeSeconds: number;
}

/**
 * Конфигурация для сервиса кэширования.
 * Позволяет настроить поведение кэша под нужды приложения.
 */
export interface ICacheConfig {
  // TTL по умолчанию для всех записей (в секундах)
  defaultTtlSeconds?: number;

  // Максимальное количество ключей в кэше
  maxKeys?: number;

  // Стратегия вытеснения записей при превышении maxKeys
  evictionStrategy?: 'lru' | 'fifo' | 'random';

  // Префикс для всех ключей кэша (для namespace isolation)
  keyPrefix?: string;

  // Включить сбор статистики (может влиять на производительность)
  collectStats?: boolean;
}

/**
 * Типы стратегий кэширования для различных сценариев использования.
 */
export type CacheStrategy =
  | 'memory'     // In-memory кэш (быстрый, но ограничен памятью)
  | 'redis'      // Redis кэш (distributed, persistent)
  | 'filesystem' // Файловый кэш (persistent, медленный)
  | 'hybrid';    // Комбинированная стратегия (memory + persistent)

/**
 * Фабрика для создания экземпляров кэш сервисов.
 * Инкапсулирует логику выбора стратегии кэширования в зависимости от окружения.
 */
export interface ICacheServiceFactory {
  /**
   * Создание кэш сервиса с указанной стратегией.
   * Автоматически выбирает оптимальную реализацию для окружения.
   */
  create(strategy: CacheStrategy, config?: ICacheConfig): ICacheService;

  /**
   * Создание кэш сервиса с автоматическим выбором стратегии.
   * Выбирает стратегию на основе переменных окружения и доступных ресурсов.
   */
  createAuto(config?: ICacheConfig): ICacheService;
} 