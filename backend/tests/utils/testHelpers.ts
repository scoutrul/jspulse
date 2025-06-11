import { Express } from 'express';
import request from 'supertest';
import { Vacancy } from '@jspulse/shared';
import { Types } from 'mongoose';

/**
 * Создает тестовую вакансию с валидными данными
 * Используется для консистентности тестовых данных
 */
export const createTestVacancy = (overrides: Partial<Vacancy> = {}): Partial<Vacancy> => {
  return {
    title: 'Frontend Developer',
    company: 'Test Company',
    location: 'Москва',
    externalId: 'test-123',
    salaryFrom: 100000,
    salaryTo: 150000,
    salaryCurrency: 'RUR',
    description: 'Тестовое описание вакансии для frontend разработчика',
    skills: ['JavaScript', 'React', 'TypeScript'],
    experience: 'От 1 года до 3 лет',
    employment: 'Полная занятость',
    url: 'https://test.example.com/vacancy/123',
    publishedAt: new Date(),
    source: 'test',
    ...overrides
  };
};

/**
 * Создает множественные тестовые вакансии
 * Полезно для тестирования pagination и filtering
 */
export const createTestVacancies = (count: number): Partial<Vacancy>[] => {
  return Array.from({ length: count }, (_, index) =>
    createTestVacancy({
      title: `Test Vacancy ${index + 1}`,
      externalId: `test-${index + 1}`,
      skills: index % 2 === 0
        ? ['JavaScript', 'React']
        : ['TypeScript', 'Vue.js']
    })
  );
};

/**
 * Выполняет GET запрос с типизированным ответом
 * Упрощает тестирование API endpoints
 */
export const makeGetRequest = async <T = any>(
  app: Express,
  endpoint: string,
  expectedStatus: number = 200
): Promise<{ body: T; status: number }> => {
  const response = await request(app)
    .get(endpoint)
    .expect(expectedStatus);

  return {
    body: response.body,
    status: response.status
  };
};

/**
 * Выполняет POST запрос с типизированным ответом
 * Упрощает тестирование создания ресурсов
 */
export const makePostRequest = async <T = any>(
  app: Express,
  endpoint: string,
  data: any,
  expectedStatus: number = 201
): Promise<{ body: T; status: number }> => {
  const response = await request(app)
    .post(endpoint)
    .send(data)
    .expect(expectedStatus);

  return {
    body: response.body,
    status: response.status
  };
};

/**
 * Генерирует валидный ObjectId для тестов
 * Полезно для тестирования с MongoDB
 */
export const generateObjectId = (): string => {
  return new Types.ObjectId().toString();
};

/**
 * Ожидает выполнения промиса в течение указанного времени
 * Полезно для тестирования асинхронных операций
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Проверяет, что объект содержит все указанные свойства
 * Упрощает assertion в тестах
 */
export const expectObjectToContain = <T extends Record<string, any>>(
  obj: T,
  expectedProps: Partial<T>
): void => {
  for (const [key, value] of Object.entries(expectedProps)) {
    expect(obj).toHaveProperty(key, value);
  }
};

/**
 * Создает mock функцию с типизацией
 * Упрощает создание typed mocks
 */
export const createMockFunction = <T extends (...args: any[]) => any>(): jest.MockedFunction<T> => {
  return jest.fn() as unknown as jest.MockedFunction<T>;
};

/**
 * Validates API response structure
 * Проверяет стандартную структуру API ответов
 */
export const expectValidApiResponse = (response: any, hasData: boolean = true): void => {
  expect(response).toHaveProperty('success');
  expect(typeof response.success).toBe('boolean');

  if (hasData) {
    expect(response).toHaveProperty('data');
  }

  if (response.success === false) {
    expect(response).toHaveProperty('error');
    expect(typeof response.error).toBe('string');
  }
}; 