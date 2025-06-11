import { DIContainer } from '../../../src/container/DIContainer';
import { ServiceLifetime } from '@jspulse/shared';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('Service Registration', () => {
    it('should register and resolve singleton service', () => {
      // Arrange
      const testToken = 'TestService';
      const testInstance = { value: 'test' };

      // Act
      container.register({
        token: testToken,
        instance: testInstance,
        lifetime: ServiceLifetime.Singleton
      });

      const resolved1 = container.resolve(testToken);
      const resolved2 = container.resolve(testToken);

      // Assert
      expect(resolved1).toBe(testInstance);
      expect(resolved2).toBe(testInstance);
      expect(resolved1).toBe(resolved2); // Same instance
    });

    it('should register and resolve transient service', () => {
      // Arrange
      const testToken = 'TestService';
      let instanceCounter = 0;

      container.register({
        token: testToken,
        factory: () => ({ id: ++instanceCounter }),
        lifetime: ServiceLifetime.Transient
      });

      // Act
      const resolved1 = container.resolve(testToken);
      const resolved2 = container.resolve(testToken);

      // Assert
      expect(resolved1).toEqual({ id: 1 });
      expect(resolved2).toEqual({ id: 2 });
      expect(resolved1).not.toBe(resolved2); // Different instances
    });

    it('should register service with factory function', () => {
      // Arrange
      const testToken = 'TestService';
      const mockFactory = jest.fn().mockReturnValue({ created: true });

      container.register({
        token: testToken,
        factory: mockFactory,
        lifetime: ServiceLifetime.Singleton
      });

      // Act
      const resolved = container.resolve(testToken);

      // Assert
      expect(mockFactory).toHaveBeenCalledWith(container);
      expect(mockFactory).toHaveBeenCalledTimes(1);
      expect(resolved).toEqual({ created: true });
    });

    it('should support dependency injection in factory', () => {
      // Arrange
      const dependencyToken = 'Dependency';
      const serviceToken = 'Service';
      const dependency = { value: 'dependency' };

      container.register({
        token: dependencyToken,
        instance: dependency,
        lifetime: ServiceLifetime.Singleton
      });

      container.register({
        token: serviceToken,
        factory: (container) => {
          const dep = container.resolve(dependencyToken);
          return { dependency: dep };
        },
        lifetime: ServiceLifetime.Singleton
      });

      // Act
      const resolved = container.resolve(serviceToken);

      // Assert
      expect(resolved).toEqual({
        dependency: { value: 'dependency' }
      });
    });

    it('should throw error when resolving unregistered service', () => {
      // Arrange
      const unregisteredToken = 'UnregisteredService';

      // Act & Assert
      expect(() => {
        container.resolve(unregisteredToken);
      }).toThrow();
    });

    it('should check service registration status', () => {
      // Arrange
      const registeredToken = 'RegisteredService';
      const unregisteredToken = 'UnregisteredService';

      container.register({
        token: registeredToken,
        instance: {},
        lifetime: ServiceLifetime.Singleton
      });

      // Act & Assert
      expect(container.isRegistered(registeredToken)).toBe(true);
      expect(container.isRegistered(unregisteredToken)).toBe(false);
    });
  });

  describe('Service Lifecycle', () => {
    it('should create singleton only once', () => {
      // Arrange
      const testToken = 'SingletonService';
      const mockFactory = jest.fn().mockReturnValue({ id: Math.random() });

      container.register({
        token: testToken,
        factory: mockFactory,
        lifetime: ServiceLifetime.Singleton
      });

      // Act
      const instance1 = container.resolve(testToken);
      const instance2 = container.resolve(testToken);
      const instance3 = container.resolve(testToken);

      // Assert
      expect(mockFactory).toHaveBeenCalledTimes(1);
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });

    it('should create new transient instance each time', () => {
      // Arrange
      const testToken = 'TransientService';
      const mockFactory = jest.fn()
        .mockReturnValueOnce({ id: 1 })
        .mockReturnValueOnce({ id: 2 })
        .mockReturnValueOnce({ id: 3 });

      container.register({
        token: testToken,
        factory: mockFactory,
        lifetime: ServiceLifetime.Transient
      });

      // Act
      const instance1 = container.resolve(testToken);
      const instance2 = container.resolve(testToken);
      const instance3 = container.resolve(testToken);

      // Assert
      expect(mockFactory).toHaveBeenCalledTimes(3);
      expect(instance1).toEqual({ id: 1 });
      expect(instance2).toEqual({ id: 2 });
      expect(instance3).toEqual({ id: 3 });
      expect(instance1).not.toBe(instance2);
      expect(instance2).not.toBe(instance3);
    });
  });

  describe('Scoped Services', () => {
    it('should create child scope', () => {
      // Act
      const scope = container.createScope();

      // Assert
      expect(scope).toBeDefined();
      expect(scope).not.toBe(container);
    });

    it('should share singleton services across scopes', () => {
      // Arrange
      const testToken = 'SingletonService';
      const testInstance = { value: 'shared' };

      container.register({
        token: testToken,
        instance: testInstance,
        lifetime: ServiceLifetime.Singleton
      });

      const scope = container.createScope();

      // Act
      const parentResolved = container.resolve(testToken);
      const scopeResolved = scope.resolve(testToken);

      // Assert
      expect(parentResolved).toBe(testInstance);
      expect(scopeResolved).toBe(testInstance);
      expect(parentResolved).toBe(scopeResolved);
    });
  });

  describe('Container Introspection', () => {
    it('should return registered tokens', () => {
      // Arrange
      const token1 = 'Service1';
      const token2 = 'Service2';

      container.register({
        token: token1,
        instance: {},
        lifetime: ServiceLifetime.Singleton
      });

      container.register({
        token: token2,
        instance: {},
        lifetime: ServiceLifetime.Transient
      });

      // Act
      const tokens = container.getRegisteredTokens();

      // Assert
      expect(tokens).toContain(token1);
      expect(tokens).toContain(token2);
      expect(tokens).toHaveLength(2);
    });

    it('should return empty array when no services registered', () => {
      // Act
      const tokens = container.getRegisteredTokens();

      // Assert
      expect(tokens).toEqual([]);
    });
  });

  describe('Dispose Resources', () => {
    it('should dispose container without errors', async () => {
      // Arrange
      container.register({
        token: 'TestService',
        instance: { value: 'test' },
        lifetime: ServiceLifetime.Singleton
      });

      // Act & Assert - should not throw
      await expect(container.dispose()).resolves.toBeUndefined();
    });

    it('should call dispose on disposable services', async () => {
      // Arrange
      const mockDispose = jest.fn().mockResolvedValue(undefined);
      const disposableService = {
        value: 'test',
        dispose: mockDispose
      };

      container.register({
        token: 'DisposableService',
        instance: disposableService,
        lifetime: ServiceLifetime.Singleton
      });

      // Resolve to ensure service is instantiated
      container.resolve('DisposableService');

      // Act
      await container.dispose();

      // Assert
      expect(mockDispose).toHaveBeenCalledTimes(1);
    });
  });
}); 