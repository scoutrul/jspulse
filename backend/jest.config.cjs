/** @type {import('jest').Config} */
module.exports = {
  // Preset для TypeScript
  preset: 'ts-jest',
  
  // Среда выполнения
  testEnvironment: 'node',
  
  // Настройка глобальных типов
  setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.ts'],
  
  // Трансформация файлов
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  
  // Маппинг модулей для shared библиотеки
  moduleNameMapper: {
    '^@jspulse/shared$': '<rootDir>/../shared/src/index.ts',
    '^@jspulse/shared/(.*)$': '<rootDir>/../shared/src/$1',
    // Преобразование всех .js расширений в tests к .ts/.js файлам
    '^(.*)(\\.js)$': ['$1.ts', '$1.js', '$1']
  },
  
  // Расширения файлов
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Паттерны поиска тестов
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  
  // Настройки coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/scripts/**',
    '!src/data/**'
  ],
  
  // Настройки окружения
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true
}; 