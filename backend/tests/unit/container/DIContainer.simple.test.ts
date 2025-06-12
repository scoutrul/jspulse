import { DIContainer } from '../../../src/container/DIContainer.js';

// Простая реализация ServiceLifetime для тестов
enum ServiceLifetime {
  Singleton = 'singleton',
  Transient = 'transient'
}

describe('DIContainer - Simple Tests', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('Basic Registration and Resolution', () => {
    it('should create container instance', () => {
      expect(container).toBeDefined();
      expect(container).toBeInstanceOf(DIContainer);
    });

    it('should register and resolve simple service', () => {
      // Arrange
      const testToken = 'TestService';
      const testInstance = { value: 'test' };

      // Act
      container.register({
        token: testToken,
        instance: testInstance,
        lifetime: ServiceLifetime.Singleton
      });

      const resolved = container.resolve(testToken);

      // Assert
      expect(resolved).toBe(testInstance);
    });

    it('should check service registration', () => {
      // Arrange
      const testToken = 'TestService';

      // Act & Assert - before registration
      expect(container.isRegistered(testToken)).toBe(false);

      // Register service
      container.register({
        token: testToken,
        instance: {},
        lifetime: ServiceLifetime.Singleton
      });

      // Act & Assert - after registration
      expect(container.isRegistered(testToken)).toBe(true);
    });

    it('should throw error for unregistered service', () => {
      // Arrange
      const unregisteredToken = 'UnregisteredService';

      // Act & Assert
      expect(() => {
        container.resolve(unregisteredToken);
      }).toThrow();
    });
  });

  describe('Factory Function Support', () => {
    it('should support factory functions', () => {
      // Arrange
      const testToken = 'FactoryService';
      const mockFactory = jest.fn().mockReturnValue({ created: true });

      // Act
      container.register({
        token: testToken,
        factory: mockFactory,
        lifetime: ServiceLifetime.Singleton
      });

      const resolved = container.resolve(testToken);

      // Assert
      expect(mockFactory).toHaveBeenCalledWith(container);
      expect(resolved).toEqual({ created: true });
    });
  });
}); 