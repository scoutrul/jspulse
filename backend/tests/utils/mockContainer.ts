import { IDIContainer, ServiceLifetime, DI_TOKENS, IServiceDescriptor, ICacheService } from '@jspulse/shared';
import { DIContainer } from '../../src/container/DIContainer.js';
import { MemoryCacheService } from '../../src/services/MemoryCacheService.js';
import { VacancyRepository } from '../../src/repositories/VacancyRepository.js';
import { createMockFunction } from './testHelpers.js';

/**
 * Создает mock DI Container для тестирования
 * Позволяет изолированно тестировать сервисы без реальных зависимостей
 */
export const createMockContainer = (): IDIContainer => {
  const container = new DIContainer();

  // Регистрируем mock сервисы
  const mockCacheService = {
    get: createMockFunction<typeof MemoryCacheService.prototype.get>(),
    set: createMockFunction<typeof MemoryCacheService.prototype.set>(),
    delete: createMockFunction<typeof MemoryCacheService.prototype.delete>(),
    clear: createMockFunction<typeof MemoryCacheService.prototype.clear>(),
    getStats: createMockFunction<typeof MemoryCacheService.prototype.getStats>(),
    has: createMockFunction<typeof MemoryCacheService.prototype.has>()
  };

  const mockVacancyRepository = {
    // Базовые Repository методы
    findById: createMockFunction<typeof VacancyRepository.prototype.findById>(),
    create: createMockFunction<typeof VacancyRepository.prototype.create>(),

    // Специализированные VacancyRepository методы
    findWithFilters: createMockFunction<typeof VacancyRepository.prototype.findWithFilters>(),
    getUniqueSkills: createMockFunction<typeof VacancyRepository.prototype.getUniqueSkills>(),
    findByExternalId: createMockFunction<typeof VacancyRepository.prototype.findByExternalId>(),
    bulkCreate: createMockFunction<typeof VacancyRepository.prototype.bulkCreate>(),
    getStatistics: createMockFunction<typeof VacancyRepository.prototype.getStatistics>()
  };

  // Регистрируем mock сервисы в контейнере
  container.register<any>({
    token: DI_TOKENS.CACHE_SERVICE,
    instance: mockCacheService,
    lifetime: ServiceLifetime.Singleton
  });

  container.register<any>({
    token: DI_TOKENS.VACANCY_REPOSITORY,
    instance: mockVacancyRepository,
    lifetime: ServiceLifetime.Singleton
  });

  return container;
};

/**
 * Создает реальный DI Container для integration тестов
 * Используется когда нужно тестировать реальные взаимодействия между сервисами
 */
export const createTestContainer = (): IDIContainer => {
  const container = new DIContainer();

  // Регистрируем реальные сервисы но с test configuration
  container.register({
    token: DI_TOKENS.CACHE_SERVICE,
    factory: () => new MemoryCacheService({
      maxKeys: 100, // Меньший размер для тестов
      defaultTtlSeconds: 300 // 5 минут для тестов
    }),
    lifetime: ServiceLifetime.Singleton
  });

  container.register({
    token: DI_TOKENS.VACANCY_REPOSITORY,
    factory: (container) => {
      const cacheService = container.resolve<ICacheService>(DI_TOKENS.CACHE_SERVICE);
      return new VacancyRepository(cacheService);
    },
    lifetime: ServiceLifetime.Singleton
  });

  return container;
};

/**
 * Получает mock сервис из контейнера с правильной типизацией
 * Упрощает получение mock объектов в тестах
 */
export const getMockService = <T>(container: IDIContainer, token: string | symbol): T => {
  return container.resolve<T>(token);
};

/**
 * Сбрасывает все моки в контейнере
 * Полезно для очистки между тестами
 */
export const resetAllMocks = (container: IDIContainer): void => {
  const mockCache = getMockService<any>(container, DI_TOKENS.CACHE_SERVICE);
  const mockRepository = getMockService<any>(container, DI_TOKENS.VACANCY_REPOSITORY);

  // Сбрасываем все mock функции cache service
  Object.values(mockCache).forEach((mockFn: any) => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockReset();
    }
  });

  // Сбрасываем все mock функции repository
  Object.values(mockRepository).forEach((mockFn: any) => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockReset();
    }
  });
};

/**
 * Настраивает типичные mock responses для тестирования
 * Предустановленные ответы для часто используемых сценариев
 */
export const setupDefaultMocks = (container: IDIContainer): void => {
  const mockCache = getMockService<any>(container, DI_TOKENS.CACHE_SERVICE);
  const mockRepository = getMockService<any>(container, DI_TOKENS.VACANCY_REPOSITORY);

  // Default cache behavior - miss initially
  mockCache.get.mockResolvedValue(null);
  mockCache.set.mockResolvedValue(undefined);
  mockCache.has.mockReturnValue(false);
  mockCache.getStats.mockReturnValue({
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalKeys: 0,
    uptimeSeconds: 0
  });

  // Default repository behavior - empty results
  mockRepository.findWithFilters.mockResolvedValue({ data: [], total: 0 });
  mockRepository.findById.mockResolvedValue(null);
  mockRepository.getUniqueSkills.mockResolvedValue([]);
  mockRepository.findByExternalId.mockResolvedValue(null);
  mockRepository.bulkCreate.mockResolvedValue({
    created: [],
    duplicates: 0,
    errors: []
  });
  mockRepository.getStatistics.mockResolvedValue({
    total: 0,
    bySource: {},
    bySkills: [],
    salaryRanges: { average: 0, median: 0, min: 0, max: 0 }
  });
}; 