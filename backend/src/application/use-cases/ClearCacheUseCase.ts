import { IUseCaseWithoutParams } from '../interfaces/IUseCase.js';
import { ICacheService } from '@jspulse/shared';

/**
 * DTO для ответа очистки кэша
 */
export interface ClearCacheResponse {
  success: boolean;
  clearedKeys: number;
  timestamp: Date;
}

/**
 * Use Case для очистки кэша
 * Заменяет бизнес-логику из старого adminRoutes
 */
export class ClearCacheUseCase implements IUseCaseWithoutParams<ClearCacheResponse> {
  constructor(
    private readonly cacheService: ICacheService
  ) { }

  async execute(): Promise<ClearCacheResponse> {
    try {
      // Получаем статистику кэша перед очисткой
      const stats = await this.cacheService.getStats();
      const clearedKeys = stats?.totalKeys || 0;

      // Очищаем весь кэш
      this.cacheService.clear();

      return {
        success: true,
        clearedKeys,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error in ClearCacheUseCase:', error);
      throw new Error('Failed to clear cache');
    }
  }
}
