/**
 * Константы для системы пагинации JSPulse
 */

// Размеры страниц
export const PAGINATION = {
  /** Размер страницы по умолчанию */
  DEFAULT_PAGE_SIZE: 10,

  /** Прогрессивные шаги для "показать еще" */
  PROGRESSIVE_STEPS: {
    STEP_1: 10,  // 10 -> 20
    STEP_2: 20,  // 20 -> 30  
    STEP_3: 30,  // 30 -> 50
    STEP_4: 50,  // 50 -> 100
  },

  /** Приращения для прогрессивной загрузки */
  INCREMENTS: {
    SMALL: 10,   // 10 -> 20, 20 -> 30
    MEDIUM: 20,  // 30 -> 50
    LARGE: 50    // 50 -> 100, 100+ -> +50
  },

  /** Пороговые значения */
  THRESHOLDS: {
    OFFSET_MODE_LIMIT: 100,      // Когда переходить в offset-режим
    SHOW_ALL_MAX_TOTAL: 50,      // Максимальное количество для кнопки "Показать все"
    OFFSET_WINDOW_SIZE: 50,      // Размер окна для замены в offset-режиме
  }
} as const;

// Анимация
export const ANIMATION = {
  /** Длительность fade-in анимации в миллисекундах */
  FADE_IN_DURATION_MS: 1200,

  /** Задержки для координации анимации */
  TIMING: {
    /** Задержка для ожидания DOM render */
    DOM_RENDER_DELAY: 50,

    /** Задержка перед скроллом после начала анимации */
    SCROLL_DELAY: 100,
  },
} as const;

// Локализация чисел
export const LOCALE = {
  /** Основная локаль для форматирования чисел */
  PRIMARY: 'ru',
} as const; 