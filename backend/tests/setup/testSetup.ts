// Test setup utilities
import { setupTestEnvironment, teardownTestEnvironment, cleanupDatabase } from './globalSetup';

export { setupTestEnvironment, teardownTestEnvironment, cleanupDatabase };

// Default test environment setup for unit tests
export const setupUnitTest = () => {
  // Мокируем внешние зависимости для unit тестов
  jest.mock('mongoose', () => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    connection: {
      readyState: 1,
      collections: {}
    }
  }));
}; 