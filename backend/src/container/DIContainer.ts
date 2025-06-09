import {
  IDIContainer,
  IServiceDescriptor,
  ServiceLifetime,
  Constructor,
  Factory,
  IDisposable,
  DI_TOKENS,
} from "@jspulse/shared";

/**
 * Простая и эффективная реализация DI Container для управления зависимостями.
 * Поддерживает различные lifecycle (singleton, transient, scoped) и автоматическое
 * разрешение зависимостей через constructor injection.
 */
export class DIContainer implements IDIContainer, IDisposable {
  // Карта зарегистрированных сервисов
  private services = new Map<string | symbol | Constructor<any>, IServiceDescriptor>();

  // Кэш singleton экземпляров для предотвращения повторного создания
  private singletonInstances = new Map<string | symbol | Constructor<any>, any>();

  // Кэш scoped экземпляров (очищается при dispose)
  private scopedInstances = new Map<string | symbol | Constructor<any>, any>();

  // Родительский контейнер для иерархических зависимостей
  private parent?: DIContainer;

  // Дочерние scope для управления жизненным циклом
  private childScopes = new Set<DIContainer>();

  constructor(parent?: DIContainer) {
    this.parent = parent;
  }

  /**
   * Регистрация сервиса с полным контролем над дескриптором.
   * Позволяет настроить все аспекты создания и управления экземплярами.
   */
  register<T>(descriptor: IServiceDescriptor<T>): IDIContainer {
    // Валидация дескриптора для предотвращения ошибок runtime
    if (!descriptor.implementation && !descriptor.factory && !descriptor.instance) {
      throw new Error(
        `Service descriptor for token ${String(descriptor.token)} must have implementation, factory, or instance`
      );
    }

    // Автоматическое определение токена если не указан
    const token = descriptor.token;
    this.services.set(token, descriptor);

    // Если передан готовый экземпляр - кэшируем его как singleton
    if (descriptor.instance && descriptor.lifetime === ServiceLifetime.Singleton) {
      this.singletonInstances.set(token, descriptor.instance);
    }

    return this;
  }

  /**
   * Удобный метод для регистрации singleton сервисов.
   * Автоматически устанавливает правильный lifecycle и создает дескриптор.
   */
  registerSingleton<T>(
    token: string | symbol | Constructor<T>,
    implementation: Constructor<T> | Factory<T>,
    dependencies?: Array<string | symbol | Constructor<any>>
  ): IDIContainer {
    const descriptor: IServiceDescriptor<T> = {
      token,
      lifetime: ServiceLifetime.Singleton,
      dependencies: dependencies || [],
    };

    // Определяем тип implementation (конструктор или фабрика)
    if (typeof implementation === 'function' && implementation.prototype) {
      descriptor.implementation = implementation as Constructor<T>;
    } else {
      descriptor.factory = implementation as Factory<T>;
    }

    return this.register(descriptor);
  }

  /**
   * Удобный метод для регистрации transient сервисов.
   * Создает новый экземпляр для каждого вызова resolve.
   */
  registerTransient<T>(
    token: string | symbol | Constructor<T>,
    implementation: Constructor<T> | Factory<T>,
    dependencies?: Array<string | symbol | Constructor<any>>
  ): IDIContainer {
    const descriptor: IServiceDescriptor<T> = {
      token,
      lifetime: ServiceLifetime.Transient,
      dependencies: dependencies || [],
    };

    if (typeof implementation === 'function' && implementation.prototype) {
      descriptor.implementation = implementation as Constructor<T>;
    } else {
      descriptor.factory = implementation as Factory<T>;
    }

    return this.register(descriptor);
  }

  /**
   * Регистрация готового экземпляра как singleton.
   * Полезно для конфигурации, подключений к БД и других готовых объектов.
   */
  registerInstance<T>(token: string | symbol | Constructor<T>, instance: T): IDIContainer {
    return this.register({
      token,
      instance,
      lifetime: ServiceLifetime.Singleton,
    });
  }

  /**
   * Разрешение зависимости по токену с автоматическим созданием экземпляра.
   * Поддерживает циклические зависимости и кэширование согласно lifecycle.
   */
  resolve<T>(token: string | symbol | Constructor<T>): T {
    // Проверяем кэш singleton экземпляров
    if (this.singletonInstances.has(token)) {
      return this.singletonInstances.get(token) as T;
    }

    // Проверяем кэш scoped экземпляров
    if (this.scopedInstances.has(token)) {
      return this.scopedInstances.get(token) as T;
    }

    // Ищем дескриптор в текущем контейнере
    let descriptor = this.services.get(token);

    // Если не найден - проверяем родительский контейнер
    if (!descriptor && this.parent) {
      return this.parent.resolve<T>(token);
    }

    if (!descriptor) {
      throw new Error(`Service with token ${String(token)} is not registered`);
    }

    // Создаем экземпляр согласно дескриптору
    const instance = this.createInstance<T>(descriptor);

    // Кэшируем согласно lifecycle
    switch (descriptor.lifetime) {
      case ServiceLifetime.Singleton:
        this.singletonInstances.set(token, instance);
        break;
      case ServiceLifetime.Scoped:
        this.scopedInstances.set(token, instance);
        break;
      // Transient экземпляры не кэшируются
    }

    return instance;
  }

  /**
   * Создание экземпляра сервиса с автоматическим разрешением зависимостей.
   * Поддерживает constructor injection через metadata о зависимостях.
   */
  private createInstance<T>(descriptor: IServiceDescriptor<T>): T {
    // Если есть готовый экземпляр - возвращаем его
    if (descriptor.instance) {
      return descriptor.instance;
    }

    // Если есть фабрика - используем её
    if (descriptor.factory) {
      return descriptor.factory(this);
    }

    // Создаем через конструктор с injection зависимостей
    if (descriptor.implementation) {
      const dependencies = descriptor.dependencies || [];
      const resolvedDependencies = dependencies.map((dep: string | symbol | Constructor<any>) => this.resolve(dep));

      return new descriptor.implementation(...resolvedDependencies);
    }

    throw new Error(`Cannot create instance for token ${String(descriptor.token)}`);
  }

  /**
   * Проверка регистрации сервиса в контейнере или родительских контейнерах.
   * Полезно для условной логики и валидации конфигурации.
   */
  isRegistered(token: string | symbol | Constructor<any>): boolean {
    if (this.services.has(token)) {
      return true;
    }

    return this.parent?.isRegistered(token) ?? false;
  }

  /**
   * Создание дочернего scope для request-scoped сервисов.
   * Каждый HTTP запрос должен иметь свой scope для изоляции состояния.
   */
  createScope(): IDIContainer {
    const childContainer = new DIContainer(this);
    this.childScopes.add(childContainer);
    return childContainer;
  }

  /**
   * Освобождение ресурсов и очистка кэшей.
   * Автоматически вызывает dispose у сервисов, которые его реализуют.
   */
  async dispose(): Promise<void> {
    // Освобождаем все дочерние scopes
    for (const child of this.childScopes) {
      await child.dispose();
    }
    this.childScopes.clear();

    // Вызываем dispose у scoped сервисов
    for (const instance of this.scopedInstances.values()) {
      if (this.isDisposable(instance)) {
        await instance.dispose();
      }
    }
    this.scopedInstances.clear();

    // Если это корневой контейнер - освобождаем singleton сервисы
    if (!this.parent) {
      for (const instance of this.singletonInstances.values()) {
        if (this.isDisposable(instance)) {
          await instance.dispose();
        }
      }
      this.singletonInstances.clear();
    }
  }

  /**
   * Проверка реализации интерфейса IDisposable.
   * Type guard для безопасного вызова dispose методов.
   */
  private isDisposable(obj: any): obj is IDisposable {
    return obj && typeof obj.dispose === 'function';
  }

  /**
   * Получение всех зарегистрированных токенов для интроспекции.
   * Включает токены из родительских контейнеров.
   */
  getRegisteredTokens(): Array<string | symbol | Constructor<any>> {
    const tokens = Array.from(this.services.keys());

    if (this.parent) {
      tokens.push(...this.parent.getRegisteredTokens());
    }

    return tokens;
  }

  /**
   * Получение статистики контейнера для мониторинга и отладки.
   * Показывает количество сервисов, экземпляров и дочерних scope.
   */
  getStats() {
    return {
      registeredServices: this.services.size,
      singletonInstances: this.singletonInstances.size,
      scopedInstances: this.scopedInstances.size,
      childScopes: this.childScopes.size,
      hasParent: !!this.parent,
    };
  }
} 