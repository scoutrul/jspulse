// Инверсия зависимостей для лучшей тестируемости
// Упрощает мокирование сервисов в тестах
export const container = {
  vacancyRepository: new VacancyRepository(),
  cacheService: new CacheService(),
  // ...
};