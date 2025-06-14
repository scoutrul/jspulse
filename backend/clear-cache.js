import { containerFactory } from './src/container/ContainerFactory.js';
import { DI_TOKENS } from '@jspulse/shared';

async function clearCache() {
  try {
    const container = containerFactory.createProduction();
    const cacheService = container.resolve(DI_TOKENS.CACHE_SERVICE);
    
    const vacancyId = '684d98d1c860a12b8d798fbe';
    const cacheKey = `vacancy:${vacancyId}`;
    
    console.log(`🗑️ Очищаю кэш для ключа: ${cacheKey}`);
    await cacheService.delete(cacheKey);
    
    console.log('✅ Кэш очищен');
    
    // Проверим статистику
    const stats = await cacheService.getStats();
    console.log('📊 Статистика кэша:', stats);
    
    await container.dispose();
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

clearCache(); 