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
  
  // Каналы для парсинга (разделенные запятыми)
  CHANNELS: process.env.TELEGRAM_CHANNELS?.split(',').map(channel => channel.trim()) || ['@vacancy_it_ulbitv'],
  
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
    // Ключевые слова для фильтрации вакансий
    REQUIRED: ['вакансия', 'работа', 'ищем', 'требуется', 'vacancy', 'job'],
    EXCLUDED: ['реклама', 'спам', 'продам', 'куплю']
  },
  
  // Настройки для извлечения данных
  PARSING: {
    // Регулярные выражения для извлечения данных из сообщений
    SALARY_REGEX: /(?:зарплата|зп|salary|от|до|\$|₽|руб)\s*:?\s*([\d\s]+(?:-[\d\s]+)?)/gi,
    COMPANY_REGEX: /(?:компания|company)\s*:?\s*([^\n]+)/gi,
    LOCATION_REGEX: /(?:город|location|локация)\s*:?\s*([^\n]+)/gi,
    SKILLS_REGEX: /(?:навыки|skills|технологии|стек)\s*:?\s*([^\n]+)/gi
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