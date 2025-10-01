import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Загружаем переменные окружения из backend/.env независимо от cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
config({ path: envPath });

// Нормализуем строку сессии: убираем кавычки, экранированные переводы строк и пробелы
const RAW_SESSION = process.env.TELEGRAM_SESSION || process.env.TELEGRAM_SESSION_STRING || '';
const NORMALIZED_SESSION = RAW_SESSION.replace(/^['"]|['"]$/g, '').replace(/\n/g, '').trim();

/**
 * Конфигурация для Telegram API и парсера
 */
export const TELEGRAM_CONFIG = {
  // Основные API credentials
  API_ID: parseInt(process.env.TELEGRAM_API_ID || '0', 10),
  API_HASH: process.env.TELEGRAM_API_HASH || '',

  // Сессия для авторизации (будет сгенерирована при первом запуске)
  SESSION_STRING: NORMALIZED_SESSION,

  // Каналы для парсинга (разделенные запятыми)
  CHANNELS: process.env.TELEGRAM_CHANNELS?.split(',').map(channel => channel.trim()) || [
    '@jobs_it_ru',
    '@job_vacancy_it',
    '@it_vakansii',
    '@devjobs_feed'
  ],

  // Настройки парсера
  PARSER_ENABLED: process.env.TELEGRAM_PARSER_ENABLED === 'true',
  PARSE_SCHEDULE: process.env.TELEGRAM_PARSE_SCHEDULE || '0 */6 * * *',
  MAX_MESSAGES: parseInt(process.env.TELEGRAM_MAX_MESSAGES || '100', 10),
  REQUEST_DELAY: parseInt(process.env.TELEGRAM_REQUEST_DELAY || '1000', 10),

  // Дополнительные настройки
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 30000,

  // Настройки для извлечения данных
  KEYWORDS: {
    REQUIRED: [
      'разработчик', 'developer', 'программист', 'engineer', 'инженер',
      'frontend', 'фронтенд', 'react', 'vue', 'angular', 'javascript', 'typescript',
      'backend', 'бэкенд', 'node.js', 'nodejs', 'nestjs', 'express',
      'fullstack', 'фуллстак',
      'junior', 'middle', 'senior', 'lead', 'teamlead'
    ],
    EXCLUDED: ['реклама', 'спам', 'продам', 'куплю', 'покупка', 'продажа']
  },

  PARSING: {
    TITLE_REGEX: /^\*\*([^*]+)\*\*/m,
    COMPANY_REGEX: /(?:\*\*)?Компания:(?:\*\*)?\s*([^\n]+)/gi,
    SALARY_REGEX: /(?:\*\*)?(?:ЗП|Уровень ЗП):(?:\*\*)?\s*([^\n]+)|(?:зарплата|salary|от|до)\s*:?\s*([\d\s\-₽$€]+(?:\s*(?:руб|euro|usd|net|гросс|на руки))?[^\n]*)/gi,
    FORMAT_REGEX: /\*\*Формат:\*\*\s*([^\n]+)/gi,
    EMPLOYMENT_REGEX: /\*\*(?:Занятость|График работы):\*\*\s*([^\n]+)/gi,
    DESCRIPTION_REGEX: /\*\*Описание:\*\*\s*(https?:\/\/[^\s\n]+)/gi,
    HASHTAGS_REGEX: /#(\w+)/g,
    HR_CONTACT_REGEX: /(?:связаться с hr|hr|контакт)\s*[-–—]\s*(@\w+)/gi,
    LOCATION_REGEX: /(?:москва|спб|питер|удалённо|remote|офис|гибрид|hybrid|казахстан|армения|грузия|сербия|польша|румыния)/gi,
    SKILLS_REGEX: /#(react|vue|angular|javascript|typescript|nodejs|node\.js|nestjs|express|frontend|backend|fullstack)/gi
  }
} as const;

export function validateTelegramConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!TELEGRAM_CONFIG.API_ID || TELEGRAM_CONFIG.API_ID === 0) errors.push('TELEGRAM_API_ID is required and must be a valid number');
  if (!TELEGRAM_CONFIG.API_HASH) errors.push('TELEGRAM_API_HASH is required');
  if (TELEGRAM_CONFIG.CHANNELS.length === 0) errors.push('At least one Telegram channel must be specified in TELEGRAM_CHANNELS');
  if (TELEGRAM_CONFIG.MAX_MESSAGES <= 0) errors.push('TELEGRAM_MAX_MESSAGES must be a positive number');
  if (TELEGRAM_CONFIG.REQUEST_DELAY < 0) errors.push('TELEGRAM_REQUEST_DELAY must be a non-negative number');
  return { isValid: errors.length === 0, errors };
}

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