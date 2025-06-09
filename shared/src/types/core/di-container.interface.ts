/**
 * Тип конструктора для классов, которые могут быть инстанцированы DI Container.
 * Поддерживает конструкторы с различным количеством параметров.
 */
export type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Фабричная функция для создания экземпляров сервисов.
 * Предоставляет полный контроль над процессом создания объектов.
 */
export type Factory<T> = (container: IDIContainer) => T;

/**
 * Lifecycle управления для сервисов в DI Container.
 * Определяет как долго живут экземпляры и когда создаются новые.
 */
export enum ServiceLifetime {
  // Новый экземпляр для каждого запроса (не кэшируется)
  Transient = 'transient',

  // Один экземпляр на весь lifecycle приложения (singleton)
  Singleton = 'singleton',

  // Один экземпляр в рамках одного HTTP запроса (scoped)
  Scoped = 'scoped'
}

/**
 * Дескриптор сервиса для регистрации в DI Container.
 * Описывает как создавать и управлять lifecycle экземпляров.
 */
export interface IServiceDescriptor<T = any> {
  // Уникальный токен для идентификации сервиса
  token: string | symbol | Constructor<T>;

  // Конструктор для создания экземпляра (если используется)
  implementation?: Constructor<T>;

  // Фабричная функция для кастомного создания
  factory?: Factory<T>;

  // Готовый экземпляр (для singleton регистрации)
  instance?: T;

  // Lifecycle управление
  lifetime: ServiceLifetime;

  // Зависимости, которые нужно инжектировать в конструктор
  dependencies?: Array<string | symbol | Constructor<any>>;
}

/**
 * Основной интерфейс DI Container для управления зависимостями.
 * Обеспечивает регистрацию сервисов и их разрешение с поддержкой lifecycle.
 */
export interface IDIContainer {
  /**
   * Регистрация сервиса в контейнере.
   * Позволяет настроить lifecycle и способ создания экземпляров.
   */
  register<T>(descriptor: IServiceDescriptor<T>): IDIContainer;

  /**
   * Регистрация singleton сервиса (удобный метод).
   * Автоматически устанавливает ServiceLifetime.Singleton.
   */
  registerSingleton<T>(
    token: string | symbol | Constructor<T>,
    implementation: Constructor<T> | Factory<T>,
    dependencies?: Array<string | symbol | Constructor<any>>
  ): IDIContainer;

  /**
   * Регистрация transient сервиса (удобный метод).
   * Создает новый экземпляр для каждого запроса.
   */
  registerTransient<T>(
    token: string | symbol | Constructor<T>,
    implementation: Constructor<T> | Factory<T>,
    dependencies?: Array<string | symbol | Constructor<any>>
  ): IDIContainer;

  /**
   * Регистрация экземпляра как singleton (удобный метод).
   * Использует готовый объект без создания новых экземпляров.
   */
  registerInstance<T>(
    token: string | symbol | Constructor<T>,
    instance: T
  ): IDIContainer;

  /**
   * Разрешение зависимости по токену.
   * Создает экземпляр согласно зарегистрированному дескриптору.
   */
  resolve<T>(token: string | symbol | Constructor<T>): T;

  /**
   * Проверка регистрации сервиса в контейнере.
   * Возвращает true если сервис зарегистрирован.
   */
  isRegistered(token: string | symbol | Constructor<any>): boolean;

  /**
   * Создание дочернего scope для scoped сервисов.
   * Используется для HTTP request isolation.
   */
  createScope(): IDIContainer;

  /**
   * Освобождение ресурсов scope (для scoped lifetime).
   * Вызывает dispose методы у сервисов если они есть.
   */
  dispose(): Promise<void>;

  /**
   * Получение всех зарегистрированных токенов.
   * Полезно для отладки и интроспекции.
   */
  getRegisteredTokens(): Array<string | symbol | Constructor<any>>;
}

/**
 * Интерфейс для сервисов, которые требуют явной очистки ресурсов.
 * Автоматически вызывается при dispose контейнера.
 */
export interface IDisposable {
  dispose(): Promise<void> | void;
}

/**
 * Декоратор для пометки классов как инжектируемых.
 * Автоматически регистрирует метаданные для dependency injection.
 */
export interface IInjectableMetadata {
  token?: string | symbol;
  dependencies?: Array<string | symbol | Constructor<any>>;
  lifetime?: ServiceLifetime;
}

/**
 * Константы для стандартных токенов сервисов.
 * Помогают избежать magic strings и обеспечивают типобезопасность.
 */
export const DI_TOKENS = {
  // Основные сервисы
  CACHE_SERVICE: Symbol('CacheService'),
  VACANCY_REPOSITORY: Symbol('VacancyRepository'),

  // Конфигурация
  DATABASE_CONFIG: Symbol('DatabaseConfig'),
  CACHE_CONFIG: Symbol('CacheConfig'),

  // HTTP и сеть
  HTTP_CLIENT: Symbol('HttpClient'),

  // Логгирование
  LOGGER: Symbol('Logger')
} as const;

/**
 * Фабрика для создания и настройки DI Container.
 * Инкапсулирует логику создания контейнера с предустановленными сервисами.
 */
export interface IDIContainerFactory {
  /**
   * Создание базового контейнера с минимальными сервисами.
   * Подходит для unit тестов и простых сценариев.
   */
  createBasic(): IDIContainer;

  /**
   * Создание полнофункционального контейнера для production.
   * Регистрирует все необходимые сервисы приложения.
   */
  createProduction(): IDIContainer;

  /**
   * Создание контейнера для тестирования с мок-сервисами.
   * Упрощает создание unit и integration тестов.
   */
  createTest(): IDIContainer;
} 