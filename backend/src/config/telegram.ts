import { config } from 'dotenv';

// Загружаем переменные окружения
config();

/**
 * Конфигурация для Telegram API и парсера
 */
export const TELEGRAM_CONFIG = {
  // Основные API credentials
  API_ID: parseInt(process.env.TELEGRAM_API_ID || '0', 10),
  API_HASH: process.env.TELEGRAM_API_HASH || '',

  // Сессия для авторизации (будет сгенерирована при первом запуске)
  SESSION_STRING: process.env.TELEGRAM_SESSION_STRING || '',

  // Каналы для парсинга (разделенные запятыми) - ОБНОВЛЕНО с проверенными публичными каналами
  CHANNELS: process.env.TELEGRAM_CHANNELS?.split(',').map(channel => channel.trim()) || [
    '@jobs_it_ru',           // Один из крупнейших IT каналов России
    '@job_vacancy_it',       // Популярный канал IT вакансий  
    '@it_vakansii',          // Активный канал с вакансиями
    '@devjobs_feed'          // Канал для разработчиков
  ],

  // Настройки парсера
  PARSER_ENABLED: process.env.TELEGRAM_PARSER_ENABLED === 'true',
  PARSE_SCHEDULE: process.env.TELEGRAM_PARSE_SCHEDULE || '0 */6 * * *', // каждые 6 часов
  MAX_MESSAGES: parseInt(process.env.TELEGRAM_MAX_MESSAGES || '100', 10),
  REQUEST_DELAY: parseInt(process.env.TELEGRAM_REQUEST_DELAY || '1000', 10), // мс между запросами

  // Дополнительные настройки
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 30000, // 30 секунд

  // Настройки для обработки сообщений
  KEYWORDS: {
    // Ключевые слова для фильтрации вакансий (расширенный список для JS экосистемы)
    REQUIRED: [
      // Общие термины
      'разработчик', 'developer', 'программист', 'engineer', 'инженер',
      // Frontend
      'frontend', 'фронтенд', 'react', 'vue', 'angular', 'javascript', 'typescript',
      // Backend 
      'backend', 'бэкенд', 'node.js', 'nodejs', 'nestjs', 'express',
      // Fullstack
      'fullstack', 'фуллстак',
      // Позиции
      'junior', 'middle', 'senior', 'lead', 'teamlead'
    ],
    EXCLUDED: ['реклама', 'спам', 'продам', 'куплю', 'покупка', 'продажа']
  },

  // Настройки для извлечения данных (специально для формата @vacancy_it_ulbitv)
  PARSING: {
    // Извлечение позиции из заголовка (жирный текст в начале сообщения)
    TITLE_REGEX: /^\*\*([^*]+)\*\*/m,

    // Извлечение компании (поддерживает оба формата - с жирным и без)
    COMPANY_REGEX: /(?:\*\*)?Компания:(?:\*\*)?\s*([^\n]+)/gi,

    // Извлечение зарплаты - поддерживает разные форматы
    SALARY_REGEX: /(?:\*\*)?(?:ЗП|Уровень ЗП):(?:\*\*)?\s*([^\n]+)|(?:зарплата|salary|от|до)\s*:?\s*([\d\s\-₽$€]+(?:\s*(?:руб|euro|usd|net|гросс|на руки))?[^\n]*)/gi,

    // Извлечение формата работы
    FORMAT_REGEX: /\*\*Формат:\*\*\s*([^\n]+)/gi,

    // Извлечение занятости (поддерживает разные названия)
    EMPLOYMENT_REGEX: /\*\*(?:Занятость|График работы):\*\*\s*([^\n]+)/gi,

    // Извлечение ссылки на описание
    DESCRIPTION_REGEX: /\*\*Описание:\*\*\s*(https?:\/\/[^\s\n]+)/gi,

    // Извлечение хештегов
    HASHTAGS_REGEX: /#(\w+)/g,

    // Извлечение контакта HR
    HR_CONTACT_REGEX: /(?:связаться с hr|hr|контакт)\s*[-–—]\s*(@\w+)/gi,

    // Поддержка локации из разных мест
    LOCATION_REGEX: /(?:москва|спб|питер|удалённо|remote|офис|гибрид|hybrid|казахстан|армения|грузия|сербия|польша|румыния)/gi,

    // Извлечение навыков из хештегов и текста
    SKILLS_REGEX: /#(react|vue|angular|javascript|typescript|nodejs|node\.js|nestjs|express|frontend|backend|fullstack)/gi
  }
} as const;

/**
 * Валидация конфигурации Telegram
 */
export function validateTelegramConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!TELEGRAM_CONFIG.API_ID || TELEGRAM_CONFIG.API_ID === 0) {
    errors.push('TELEGRAM_API_ID is required and must be a valid number');
  }

  if (!TELEGRAM_CONFIG.API_HASH) {
    errors.push('TELEGRAM_API_HASH is required');
  }

  if (TELEGRAM_CONFIG.CHANNELS.length === 0) {
    errors.push('At least one Telegram channel must be specified in TELEGRAM_CHANNELS');
  }

  if (TELEGRAM_CONFIG.MAX_MESSAGES <= 0) {
    errors.push('TELEGRAM_MAX_MESSAGES must be a positive number');
  }

  if (TELEGRAM_CONFIG.REQUEST_DELAY < 0) {
    errors.push('TELEGRAM_REQUEST_DELAY must be a non-negative number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Логирование конфигурации (без чувствительных данных)
 */
export function logTelegramConfig(): void {
  console.log('📱 Telegram Configuration:');
  console.log(`  - API ID: ${TELEGRAM_CONFIG.API_ID ? '***' : 'NOT SET'}`);
  console.log(`  - API Hash: ${TELEGRAM_CONFIG.API_HASH ? '***' : 'NOT SET'}`);
  console.log(`  - Session: ${TELEGRAM_CONFIG.SESSION_STRING ? 'SET' : 'NOT SET'}`);
  console.log(`  - Channels: ${TELEGRAM_CONFIG.CHANNELS.join(', ')}`);
  console.log(`  - Parser Enabled: ${TELEGRAM_CONFIG.PARSER_ENABLED}`);
  console.log(`  - Schedule: ${TELEGRAM_CONFIG.PARSE_SCHEDULE}`);
  console.log(`  - Max Messages: ${TELEGRAM_CONFIG.MAX_MESSAGES}`);
  console.log(`  - Request Delay: ${TELEGRAM_CONFIG.REQUEST_DELAY}ms`);
}

// Экспортируем отдельные значения для удобства
export const {
  API_ID: TELEGRAM_API_ID,
  API_HASH: TELEGRAM_API_HASH,
  SESSION_STRING: TELEGRAM_SESSION_STRING,
  CHANNELS: TELEGRAM_CHANNELS,
  PARSER_ENABLED: TELEGRAM_PARSER_ENABLED,
  PARSE_SCHEDULE: TELEGRAM_PARSE_SCHEDULE,
  MAX_MESSAGES: TELEGRAM_MAX_MESSAGES,
  REQUEST_DELAY: TELEGRAM_REQUEST_DELAY
} = TELEGRAM_CONFIG;