import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { setupServer } from 'msw/node';

// MSW Setup for API mocking
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock SvelteKit runtime
vi.mock('$app/environment', () => ({
  browser: false,
  dev: true
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(() => vi.fn())
  },
  navigating: {
    subscribe: vi.fn(() => vi.fn())
  }
}));

// Global test utilities
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
};

// Workaround for SvelteKit fetch in tests
global.fetch = global.fetch || vi.fn(); 