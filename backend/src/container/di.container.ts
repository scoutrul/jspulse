// Инверсия зависимостей для лучшей тестируемости

import { VacancyRepository } from "src/repositories/vacancy.repository.js";
import { CacheService } from "src/services/cache.service.js";

// Упрощает мокирование сервисов в тестах
export const container = {
  vacancyRepository: new VacancyRepository(),
  cacheService: new CacheService(),
  // ...
};