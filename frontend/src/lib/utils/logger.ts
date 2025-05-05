/**
 * Простой логгер с возможностью включения/отключения вывода
 */

// Флаг включения/отключения логов
const isLoggingEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true';

// Уровни логирования
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Функция для вывода логов
const log = (level: LogLevel, context: string, message: string, data?: any) => {
  if (!isLoggingEnabled) return;

  const prefix = `[${context}]`;

  switch (level) {
    case 'debug':
      console.debug(prefix, message, data !== undefined ? data : '');
      break;
    case 'info':
      console.info(prefix, message, data !== undefined ? data : '');
      break;
    case 'warn':
      console.warn(prefix, message, data !== undefined ? data : '');
      break;
    case 'error':
      console.error(prefix, message, data !== undefined ? data : '');
      break;
  }
};

export const logger = {
  debug: (context: string, message: string, data?: any) => log('debug', context, message, data),
  info: (context: string, message: string, data?: any) => log('info', context, message, data),
  warn: (context: string, message: string, data?: any) => log('warn', context, message, data),
  error: (context: string, message: string, data?: any) => log('error', context, message, data),
  isEnabled: () => isLoggingEnabled
}; 