/**
 * Константы для системы пагинации JSPulse
 */

// Размеры страниц
export const PAGINATION = {
  /** Размер страницы по умолчанию */
  DEFAULT_PAGE_SIZE: 10,

  /** Доступные размеры страниц */
  AVAILABLE_PAGE_SIZES: [10, 20, 50, 100] as const,

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

  /** Пороговые значения */
  THRESHOLDS: {
    OFFSET_MODE_LIMIT: 100,      // Когда переходить в offset-режим
    SHOW_ALL_MAX_TOTAL: 50,      // Максимальное количество для кнопки "Показать все"
    OFFSET_WINDOW_SIZE: 50,      // Размер окна для замены в offset-режиме
    VIRTUAL_WINDOW_SIZE: 100,    // Размер виртуального окна (загружаем)
  }
} as const;

// Анимация
export const ANIMATION = {
  /** Длительность fade-in анимации в миллисекундах */
  FADE_IN_DURATION_MS: 1200,

  /** Длительность fade-in анимации в CSS (строка) */
  FADE_IN_DURATION_CSS: '1.2s',

  /** Задержки для координации анимации */
  TIMING: {
    /** Задержка для ожидания DOM render */
    DOM_RENDER_DELAY: 50,

    /** Задержка перед скроллом после начала анимации */
    SCROLL_DELAY: 100,

    /** Общее время взаимодействия от клика до завершения */
    TOTAL_INTERACTION_TIME: 1300  // FADE_IN_DURATION_MS + SCROLL_DELAY
  },

  /** Easing функции */
  EASING: {
    /** Основная easing функция для анимаций */
    PRIMARY: 'cubic-bezier(0.4, 0, 0.2, 1)',

    /** Easing для fade-in анимации */
    FADE_IN: 'ease-out'
  }
} as const;

// UX константы
export const UX = {
  /** Отступ внизу страницы для комфортного скролла */
  BOTTOM_PADDING: '50vh',

  /** Отступ внизу страницы в пикселях для расчетов */
  BOTTOM_PADDING_FACTOR: 0.5, // 50% от высоты экрана

  /** Минимальная ширина кнопки "показать еще" */
  LOAD_MORE_BUTTON_MIN_WIDTH: {
    DESKTOP: '160px',
    MOBILE: '140px'
  }
} as const;

// Локализация чисел
export const LOCALE = {
  /** Основная локаль для форматирования чисел */
  PRIMARY: 'ru',

  /** Резервная локаль */
  FALLBACK: 'en'
} as const;

// Типы для TypeScript
export type PageSize = typeof PAGINATION.AVAILABLE_PAGE_SIZES[number];
export type ProgressiveStep = keyof typeof PAGINATION.PROGRESSIVE_STEPS;
export type AnimationTiming = keyof typeof ANIMATION.TIMING; 