import {
  ICacheService,
  ICacheStats,
  ICacheConfig
} from "@jspulse/shared";

/**
 * Структура записи в кэше с метаданными.
 * Содержит значение, время создания и TTL для управления жизненным циклом.
 */
interface CacheEntry<T> {
  value: T;
  createdAt: number;
  ttlSeconds?: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * In-memory реализация кэш сервиса с поддержкой TTL и LRU eviction.
 * Оптимизирована для быстрого доступа и автоматической очистки истекших записей.
 * Подходит для single-instance приложений и development окружения.
 */
export class MemoryCacheService implements ICacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly config: Required<ICacheConfig>;
  private cleanupTimer?: NodeJS.Timeout; // Добавляем reference на timer для cleanup
  private stats = {
    hits: 0,
    misses: 0,
    startTime: Date.now()
  };

  constructor(config: ICacheConfig = {}) {
    // Применяем конфигурацию по умолчанию с возможностью переопределения
    this.config = {
      defaultTtlSeconds: config.defaultTtlSeconds ?? 300, // 5 минут
      maxKeys: config.maxKeys ?? 1000,
      evictionStrategy: config.evictionStrategy ?? 'lru',
      keyPrefix: config.keyPrefix ?? '',
      collectStats: config.collectStats ?? true
    };

    // Запускаем периодическую очистку истекших записей
    if (this.config.defaultTtlSeconds > 0) {
      this.startCleanupInterval();
    }
  }

  /**
   * Cleanup resources - останавливает cleanup timer
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Сохранение значения с автоматическим управлением размером кэша.
   * При превышении лимита применяется стратегия вытеснения.
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const fullKey = this.buildKey(key);
    const now = Date.now();

    // Проверяем лимит размера кэша перед добавлением
    if (this.cache.size >= this.config.maxKeys && !this.cache.has(fullKey)) {
      this.evictLeastUsed();
    }

    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      ttlSeconds: ttlSeconds ?? this.config.defaultTtlSeconds,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(fullKey, entry);
  }

  /**
   * Получение значения с автоматической проверкой TTL.
   * Обновляет статистику доступа для LRU алгоритма.
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.incrementMisses();
      return null;
    }

    // Проверяем TTL
    if (this.isExpired(entry)) {
      this.cache.delete(fullKey);
      this.incrementMisses();
      return null;
    }

    // Обновляем статистику доступа для LRU
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.incrementHits();
    return entry.value as T;
  }

  /**
   * Проверка существования ключа с учетом TTL.
   * Автоматически удаляет истекшие записи.
   */
  async has(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(fullKey);
      return false;
    }

    return true;
  }

  /**
   * Удаление записи по ключу.
   * Возвращает true если запись была найдена и удалена.
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    return this.cache.delete(fullKey);
  }

  /**
   * Полная очистка кэша и сброс статистики.
   * Используйте осторожно в production.
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Получение статистики для мониторинга эффективности.
   * Включает hit rate, размер кэша и время работы.
   */
  async getStats(): Promise<ICacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    // Приблизительный расчет размера в байтах
    const sizeBytes = this.estimateSizeBytes();

    return {
      totalKeys: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      sizeBytes,
      uptimeSeconds: Math.floor((Date.now() - this.stats.startTime) / 1000)
    };
  }

  /**
   * Построение полного ключа с префиксом.
   * Обеспечивает namespace isolation между различными компонентами.
   */
  private buildKey(key: string): string {
    return this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key;
  }

  /**
   * Проверка истечения TTL для записи.
   * Возвращает true если запись устарела и должна быть удалена.
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    if (!entry.ttlSeconds || entry.ttlSeconds <= 0) {
      return false; // Бесконечный TTL
    }

    const ageSeconds = (Date.now() - entry.createdAt) / 1000;
    return ageSeconds > entry.ttlSeconds;
  }

  /**
   * Проактивная очистка всех истекших записей.
   * Вызывается перед LRU eviction для освобождения места.
   */
  private cleanupExpiredKeys(): number {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Вытеснение наименее используемых записей при превышении лимита.
   * Реализует LRU (Least Recently Used) алгоритм.
   * ИСПРАВЛЕНО: сначала удаляет expired keys, потом применяет LRU.
   */
  private evictLeastUsed(): void {
    // 1. Сначала очищаем все истекшие записи
    const expiredCount = this.cleanupExpiredKeys();

    // 2. Если после очистки истекших записей всё ещё превышен лимит, применяем LRU
    if (this.cache.size >= this.config.maxKeys) {
      const entries = Array.from(this.cache.entries());

      // Сортируем по времени последнего доступа (LRU)
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

      // Удаляем 10% от максимального размера для batch eviction
      const toEvict = Math.max(1, Math.floor(this.config.maxKeys * 0.1));

      for (let i = 0; i < toEvict && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Периодическая очистка истекших записей для предотвращения утечек памяти.
   * Запускается в фоновом режиме каждые 60 секунд.
   * ИСПРАВЛЕНО: добавлен unref() для предотвращения timer leaks в тестах.
   */
  private startCleanupInterval(): void {
    const cleanupInterval = 60000; // 1 минута

    this.cleanupTimer = setInterval(() => {
      const expiredCount = this.cleanupExpiredKeys();

      // Логируем очистку в debug режиме
      if (expiredCount > 0) {
        console.debug(`[MemoryCacheService] Очищено ${expiredCount} истекших записей`);
      }
    }, cleanupInterval);

    // Предотвращаем timer leak в тестах
    this.cleanupTimer.unref();
  }

  /**
   * Приблизительный расчет размера кэша в байтах.
   * Используется для мониторинга потребления памяти.
   */
  private estimateSizeBytes(): number {
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Размер ключа
      totalSize += key.length * 2; // UTF-16

      // Приблизительный размер значения
      try {
        const serialized = JSON.stringify(entry.value);
        totalSize += serialized.length * 2;
      } catch {
        // Fallback для не-сериализуемых объектов
        totalSize += 100;
      }

      // Размер метаданных записи
      totalSize += 64; // 8 байт на каждое number поле
    }

    return totalSize;
  }

  /**
   * Увеличение счетчика попаданий в кэш.
   * Используется для расчета hit rate.
   */
  private incrementHits(): void {
    if (this.config.collectStats) {
      this.stats.hits++;
    }
  }

  /**
   * Увеличение счетчика промахов кэша.
   * Используется для расчета hit rate.
   */
  private incrementMisses(): void {
    if (this.config.collectStats) {
      this.stats.misses++;
    }
  }

  /**
   * Сброс статистики кэша.
   * Вызывается при очистке кэша.
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      startTime: Date.now()
    };
  }
} 