import { IDIContainer, IDIContainerFactory, DI_TOKENS, ServiceLifetime, ICacheService } from "@jspulse/shared";
import { DIContainer } from "./DIContainer.js";
import { VacancyRepository } from "../repositories/VacancyRepository.js";
import { MemoryCacheService } from "../services/MemoryCacheService.js";
import { Vacancy } from "../models/Vacancy.js";

/**
 * Фабрика для создания и настройки DI Container с различными конфигурациями.
 * Инкапсулирует логику регистрации сервисов для разных сценариев использования.
 */
export class ContainerFactory implements IDIContainerFactory {

  /**
   * Создание базового контейнера с минимальными сервисами.
   * Подходит для unit тестов и простых сценариев без внешних зависимостей.
   */
  createBasic(): IDIContainer {
    const container = new DIContainer();

    // Регистрируем только базовые сервисы без внешних зависимостей
    container.registerSingleton(
      DI_TOKENS.CACHE_SERVICE,
      () => new MemoryCacheService({
        maxKeys: 100,
        defaultTtlSeconds: 300, // 5 минут
        collectStats: true,
      })
    );

    return container;
  }

  /**
   * Создание полнофункционального контейнера для production.
   * Регистрирует все необходимые сервисы приложения с оптимальными настройками.
   */
  createProduction(): IDIContainer {
    const container = new DIContainer();

    // Регистрируем кэш-сервис как singleton с production настройками
    container.registerSingleton(
      DI_TOKENS.CACHE_SERVICE,
      () => new MemoryCacheService({
        maxKeys: 10000,        // Больший размер для production
        defaultTtlSeconds: 900,    // 15 минут по умолчанию
        collectStats: true,
      })
    );

    // Регистрируем VacancyRepository с автоматическим injection кэша
    container.registerSingleton(
      DI_TOKENS.VACANCY_REPOSITORY,
      (container: IDIContainer) => {
        const cacheService = container.resolve(DI_TOKENS.CACHE_SERVICE) as ICacheService;
        return new VacancyRepository(cacheService);
      }
    );

    // Можно добавить другие production сервисы
    this.registerProductionServices(container);

    return container;
  }

  /**
   * Создание контейнера для тестирования с мок-сервисами.
   * Упрощает создание unit и integration тестов с подменой зависимостей.
   */
  createTest(): IDIContainer {
    const container = new DIContainer();

    // Регистрируем тестовый кэш с минимальными лимитами
    container.registerSingleton(
      DI_TOKENS.CACHE_SERVICE,
      () => new MemoryCacheService({
        maxKeys: 10,           // Маленький размер для тестов
        defaultTtlSeconds: 1,      // 1 секунда для быстрых тестов
        collectStats: true,
      })
    );

    // В реальном проекте здесь были бы mock-объекты
    container.registerSingleton(
      DI_TOKENS.VACANCY_REPOSITORY,
      (container: IDIContainer) => {
        const cacheService = container.resolve(DI_TOKENS.CACHE_SERVICE) as ICacheService;
        return new VacancyRepository(cacheService);
      }
    );

    return container;
  }

  /**
   * Регистрация дополнительных production сервисов.
   * Выделено в отдельный метод для улучшения читаемости кода.
   */
  private registerProductionServices(container: IDIContainer): void {
    // Регистрация конфигурации БД
    container.registerInstance(DI_TOKENS.DATABASE_CONFIG, {
      url: process.env.MONGODB_URI || 'mongodb://localhost:27017/jspulse',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    });

    // Регистрация конфигурации кэша
    container.registerInstance(DI_TOKENS.CACHE_CONFIG, {
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || '10000'),
      defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '900000'),
      cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '60000'),
    });

    // Здесь можно добавить другие сервисы:
    // - HTTP клиенты
    // - Логгеры  
    // - Внешние API клиенты
    // - Мониторинг и метрики
  }

  /**
   * Создание специализированного контейнера для HTTP middleware.
   * Включает request-scoped сервисы для изоляции состояния между запросами.
   */
  createForRequest(parentContainer: IDIContainer): IDIContainer {
    const requestContainer = parentContainer.createScope();

    // Здесь можно зарегистрировать request-specific сервисы
    // Например: correlation ID, user context, request metrics

    return requestContainer;
  }

  /**
   * Валидация корректности настройки контейнера.
   * Проверяет что все критически важные сервисы зарегистрированы.
   */
  validateContainer(container: IDIContainer): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Проверяем обязательные сервисы
    const requiredServices = [
      DI_TOKENS.CACHE_SERVICE,
      DI_TOKENS.VACANCY_REPOSITORY,
    ];

    for (const token of requiredServices) {
      if (!container.isRegistered(token)) {
        errors.push(`Required service ${String(token)} is not registered`);
      }
    }

    // Проверяем что сервисы можно разрешить без ошибок
    try {
      for (const token of requiredServices) {
        if (container.isRegistered(token)) {
          container.resolve(token);
        }
      }
    } catch (error) {
      errors.push(`Service resolution failed: ${error}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Экспортируем singleton экземпляр фабрики для удобства использования
export const containerFactory = new ContainerFactory(); 