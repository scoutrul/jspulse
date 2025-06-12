/**
 * Общие константы для системы пагинации JSPulse
 * Используются как на frontend, так и на backend
 */

// Размеры страниц
export const PAGINATION = {
  /** Размер страницы по умолчанию */
  DEFAULT_PAGE_SIZE: 10,

  /** Доступные размеры страниц */
  AVAILABLE_PAGE_SIZES: [10, 20, 30, 50, 100] as const,

  /** Максимальный размер страницы */
  MAX_PAGE_SIZE: 500,

  /** Прогрессивные шаги для "показать еще" */
  PROGRESSIVE_STEPS: {
    STEP_1: 10,  // 10 -> 20
    STEP_2: 20,  // 20 -> 30  
    STEP_3: 30,  // 30 -> 50
    STEP_4: 50,  // 50 -> 100
    INCREMENTAL: 50  // 100+ -> +50
  },

  /** Приращения для прогрессивной загрузки */
  INCREMENTS: {
    SMALL: 10,   // 10 -> 20, 20 -> 30
    MEDIUM: 20,  // 30 -> 50
    LARGE: 50    // 50 -> 100, 100+ -> +50
  },

  /** Валидация */
  VALIDATION: {
    MIN_PAGE: 0,
    MIN_LIMIT: 1,
    MAX_LIMIT: 500
  }
} as const;

// API константы
export const API = {
  /** Endpoints */
  ENDPOINTS: {
    VACANCIES: '/api/vacancies',
    SKILLS: '/api/skills',
    VACANCY_BY_ID: '/api/vacancies/{id}'
  },

  /** HTTP методы */
  METHODS: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE'
  },

  /** Коды ответов */
  STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  }
} as const;

// Локализация
export const LOCALE = {
  /** Основная локаль для форматирования чисел */
  PRIMARY: 'ru',

  /** Резервная локаль */
  FALLBACK: 'en'
} as const;

// Типы для TypeScript
export type PageSize = typeof PAGINATION.AVAILABLE_PAGE_SIZES[number];
export type ProgressiveStep = keyof typeof PAGINATION.PROGRESSIVE_STEPS;
export type HttpMethod = typeof API.METHODS[keyof typeof API.METHODS];
export type HttpStatus = typeof API.STATUS[keyof typeof API.STATUS]; 