import { MemoryCacheService } from '../services/MemoryCacheService.js';
import { VacancyRepository } from '../repositories/VacancyRepository.js';
import { SchedulerService } from '../services/SchedulerService.js';
import { DIContainer } from './DIContainer.js';

export function registerServices(container: DIContainer): void {
  // Регистрируем MemoryCacheService как singleton
  container.registerSingleton('cacheService', () => {
    return new MemoryCacheService({
      defaultTtlSeconds: 300, // 5 минут
      maxKeys: 1000,
      collectStats: true
    });
  });

  // Регистрируем VacancyRepository
  container.registerSingleton('vacancyRepository', () => {
    const cacheService = new MemoryCacheService({
      defaultTtlSeconds: 300,
      maxKeys: 1000,
      collectStats: true
    });
    return new VacancyRepository(cacheService);
  });

  // Регистрируем SchedulerService как singleton
  container.registerSingleton('SchedulerService', () => {
    return new SchedulerService({
      // Configuration через environment variables уже обрабатывается в конструкторе
    });
  });
}