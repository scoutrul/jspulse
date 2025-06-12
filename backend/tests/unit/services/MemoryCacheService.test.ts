import { MemoryCacheService } from '../../../src/services/MemoryCacheService.js';

describe('MemoryCacheService', () => {
  let cacheService: MemoryCacheService;

  beforeEach(() => {
    cacheService = new MemoryCacheService({
      maxKeys: 3, // Small size for easy testing
      defaultTtlSeconds: 1 // 1 second TTL for quick tests
    });
  });

  afterEach(async () => {
    await cacheService.clear();
    // Важно: вызываем destroy() для предотвращения timer leaks в тестах
    cacheService.destroy();
  });

  describe('Basic Operations', () => {
    it('should create cache service instance', () => {
      expect(cacheService).toBeDefined();
      expect(cacheService).toBeInstanceOf(MemoryCacheService);
    });

    it('should set and get values', async () => {
      // Arrange
      const key = 'testKey';
      const value = { message: 'test value' };

      // Act
      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      // Act
      const result = await cacheService.get('nonExistentKey');

      // Assert
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      // Arrange
      const key = 'existsTest';
      const value = 'test';

      // Act & Assert - before set
      expect(await cacheService.has(key)).toBe(false);

      // Set value
      await cacheService.set(key, value);

      // Act & Assert - after set
      expect(await cacheService.has(key)).toBe(true);
    });

    it('should delete values', async () => {
      // Arrange
      const key = 'deleteTest';
      const value = 'test value';

      await cacheService.set(key, value);
      expect(await cacheService.has(key)).toBe(true);

      // Act
      await cacheService.delete(key);

      // Assert
      expect(await cacheService.has(key)).toBe(false);
      expect(await cacheService.get(key)).toBeNull();
    });

    it('should clear all values', async () => {
      // Arrange
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      // Verify they exist
      expect(await cacheService.has('key1')).toBe(true);
      expect(await cacheService.has('key2')).toBe(true);
      expect(await cacheService.has('key3')).toBe(true);

      // Act
      await cacheService.clear();

      // Assert
      expect(await cacheService.has('key1')).toBe(false);
      expect(await cacheService.has('key2')).toBe(false);
      expect(await cacheService.has('key3')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect default TTL', async () => {
      // Arrange
      const key = 'ttlTest';
      const value = 'expires soon';

      // Act
      await cacheService.set(key, value); // Uses default 1000ms TTL

      // Immediately accessible
      expect(await cacheService.get(key)).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Assert - should be expired
      expect(await cacheService.get(key)).toBeNull();
      expect(await cacheService.has(key)).toBe(false);
    });

    it('should respect custom TTL', async () => {
      // Arrange
      const key = 'customTTL';
      const value = 'short lived';
      const customTTL = 0.5; // 0.5 seconds (исправлено с 500ms)

      // Act
      await cacheService.set(key, value, customTTL);

      // Immediately accessible
      expect(await cacheService.get(key)).toEqual(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 600));

      // Assert - should be expired
      expect(await cacheService.get(key)).toBeNull();
    });

    it('should handle values without TTL', async () => {
      // Arrange
      const key = 'noTTL';
      const value = 'permanent';

      // Act
      await cacheService.set(key, value, -1); // -1 means no expiration

      // Wait beyond default TTL
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Assert - should still exist
      expect(await cacheService.get(key)).toEqual(value);
      expect(await cacheService.has(key)).toBe(true);
    });
  });

  describe('LRU (Least Recently Used) Eviction', () => {
    it('should evict least recently used items when maxSize exceeded', async () => {
      // Arrange - maxSize is 3
      await cacheService.set('key1', 'value1', -1); // No TTL
      await cacheService.set('key2', 'value2', -1);
      await cacheService.set('key3', 'value3', -1);

      // All should exist
      expect(await cacheService.has('key1')).toBe(true);
      expect(await cacheService.has('key2')).toBe(true);
      expect(await cacheService.has('key3')).toBe(true);

      // Act - add fourth item, should evict key1 (oldest)
      await cacheService.set('key4', 'value4', -1);

      // Assert
      expect(await cacheService.has('key1')).toBe(false); // Evicted
      expect(await cacheService.has('key2')).toBe(true);
      expect(await cacheService.has('key3')).toBe(true);
      expect(await cacheService.has('key4')).toBe(true);
    });

    it('should update access order when getting values', async () => {
      // Arrange - создаем entries с четкими временными интервалами
      await cacheService.set('key1', 'value1', -1);
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
      await cacheService.set('key2', 'value2', -1);
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
      await cacheService.set('key3', 'value3', -1);
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay

      // Access key1 to make it most recently used
      await cacheService.get('key1');
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay

      // Act - add fourth item, should evict key2 (now oldest)
      await cacheService.set('key4', 'value4', -1);

      // Assert
      expect(await cacheService.has('key1')).toBe(true); // Still exists (recently accessed)
      expect(await cacheService.has('key2')).toBe(false); // Evicted (oldest lastAccessed)
      expect(await cacheService.has('key3')).toBe(true);
      expect(await cacheService.has('key4')).toBe(true);
    });

    it('should handle mixed TTL and LRU eviction', async () => {
      // Arrange - fill cache
      await cacheService.set('key1', 'value1', 2); // Long TTL (2 seconds)
      await cacheService.set('key2', 'value2', 0.1);  // Short TTL (0.1 sec = 100ms)
      await cacheService.set('key3', 'value3', 2); // Long TTL (2 seconds)

      // Wait for key2 to expire
      await new Promise(resolve => setTimeout(resolve, 150)); // 150ms

      // ИСПРАВЛЕНО: проверяем что key2 expired через has() - это вызовет cleanup
      expect(await cacheService.has('key2')).toBe(false);

      // Act - add new item, теперь expired key2 должен быть очищен
      await cacheService.set('key4', 'value4', -1);

      // Assert - key1 and key3 should still exist, expired key2 очищен
      expect(await cacheService.has('key1')).toBe(true);
      expect(await cacheService.has('key3')).toBe(true);
      expect(await cacheService.has('key4')).toBe(true);
      // Убеждаемся что key2 действительно очищен
      expect(await cacheService.get('key2')).toBeNull();
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track cache statistics', async () => {
      // Act - perform various operations
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      await cacheService.get('key1'); // Hit
      await cacheService.get('key2'); // Hit
      await cacheService.get('nonexistent'); // Miss

      const stats = await cacheService.getStats();

      // Assert
      expect(stats).toHaveProperty('totalKeys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');

      expect(stats.totalKeys).toBe(2);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1); // 2/3 ≈ 66.67%
    });

    it('should handle division by zero in hit rate calculation', async () => {
      // Act - get stats without any operations
      const stats = await cacheService.getStats();

      // Assert
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0); // Should handle 0/0 gracefully
    });

    it('should update stats correctly after eviction', async () => {
      // Arrange - fill cache beyond capacity
      await cacheService.set('key1', 'value1', -1);
      await cacheService.set('key2', 'value2', -1);
      await cacheService.set('key3', 'value3', -1);
      await cacheService.set('key4', 'value4', -1); // Triggers eviction

      const stats = await cacheService.getStats();

      // Assert - size should respect maxKeys (3 from config)
      expect(stats.totalKeys).toBe(3);
      expect(stats.totalKeys).toBeLessThanOrEqual(3); // maxKeys from config
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle undefined and null values', async () => {
      // Act & Assert
      await cacheService.set('nullKey', null);
      await cacheService.set('undefinedKey', undefined);

      expect(await cacheService.get('nullKey')).toBeNull();
      expect(await cacheService.get('undefinedKey')).toBeUndefined();
      expect(await cacheService.has('nullKey')).toBe(true);
      expect(await cacheService.has('undefinedKey')).toBe(true);
    });

    it('should handle complex object values', async () => {
      // Arrange
      const complexObject = {
        nested: {
          array: [1, 2, 3],
          object: { prop: 'value' }
        },
        date: new Date(),
        number: 42,
        boolean: true
      };

      // Act
      await cacheService.set('complex', complexObject);
      const result = await cacheService.get('complex');

      // Assert
      expect(result).toEqual(complexObject);
    });

    it('should handle concurrent operations gracefully', async () => {
      // Arrange
      const promises: Promise<void>[] = [];

      // Act - perform concurrent operations
      for (let i = 0; i < 10; i++) {
        promises.push(cacheService.set(`key${i}`, `value${i}`));
      }

      await Promise.all(promises);

      // Assert - cache should be in consistent state
      const stats = await cacheService.getStats();
      expect(stats.totalKeys).toBeLessThanOrEqual(3); // maxKeys from config

      // Some values should exist (depending on eviction)
      let existingCount = 0;
      for (let i = 0; i < 10; i++) {
        if (await cacheService.has(`key${i}`)) {
          existingCount++;
        }
      }
      expect(existingCount).toBeGreaterThan(0);
      expect(existingCount).toBeLessThanOrEqual(3); // maxKeys
    });
  });
}); 