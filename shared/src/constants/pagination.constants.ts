/**
 * Общие константы для системы пагинации JSPulse
 * Используются как на frontend, так и на backend
 */

/**
 * Константы для пагинации
 * TEST: изменение для проверки hot reload
 */
export const PAGINATION = {
  /** Размер страницы по умолчанию */
  DEFAULT_PAGE_SIZE: 10,

  /** Доступные размеры страниц */
  AVAILABLE_PAGE_SIZES: [10, 20, 50, 100] as const,

  /** Максимальный размер страницы */
  MAX_PAGE_SIZE: 100,

  /** Прогрессивные шаги для "показать еще" */
  PROGRESSIVE_STEPS: {
    STEP_1: 10,  // Первый шаг
    STEP_2: 20,  // Второй шаг  
    STEP_3: 30,  // Третий шаг
    STEP_4: 50,  // Четвертый шаг
    INCREMENTAL: 50, // Для совместимости
  },

  /** Приращения для прогрессивной загрузки */
  INCREMENTS: {
    SMALL: 10,   // Маленький прирост (10→20, 20→30)
    MEDIUM: 20,  // Средний прирост (30→50) 
    LARGE: 50,   // Большой прирост (50→100)
  },

  /** Пороговые значения */
  THRESHOLDS: {
    /** Порог для offset-режима */
    OFFSET_MODE_LIMIT: 100,      // Когда переходить в offset-режим
    /** Порог для кнопки "Показать все" */
    SHOW_ALL_MAX_TOTAL: 50,      // Максимальное количество для кнопки "Показать все"
    /** Размер окна в offset-режиме */
    OFFSET_WINDOW_SIZE: 50,      // Размер окна для замены в offset-режиме
    /** Размер виртуального окна */
    VIRTUAL_WINDOW_SIZE: 100,    // Размер виртуального окна (загружаем)
  },

  /** Валидация */
  VALIDATION: {
    MIN_PAGE: 0,
    MIN_LIMIT: 1,
    MAX_LIMIT: 100
  }
} as const;

/**
 * Константы для системы архивации вакансий
 */
export const ARCHIVE = {
  /** Время жизни активной вакансии в днях */
  ACTIVE_VACANCY_DAYS: 30,

  /** Время жизни активной вакансии в миллисекундах */
  ACTIVE_VACANCY_MS: 30 * 24 * 60 * 60 * 1000, // 30 дней в мс

  /** Параметры запроса */
  QUERY_PARAMS: {
    INCLUDE_ARCHIVED: 'includeArchived'
  },

  /** Статусы архивации */
  STATUS: {
    ACTIVE: 'active',
    ARCHIVED: 'archived'
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
export type ArchiveStatus = typeof ARCHIVE.STATUS[keyof typeof ARCHIVE.STATUS]; 