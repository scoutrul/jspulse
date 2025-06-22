import { writable } from 'svelte/store';
import type { ParsingLog } from '../types/admin.types';

// Стор для логов парсинга
export const parsingLogs = writable<ParsingLog[]>([]);

// Функция для добавления лога
export function addParsingLog(message: string, type: ParsingLog['type'] = 'info') {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const timestamp = new Date().toLocaleTimeString('ru');

  const log: ParsingLog = {
    id,
    message,
    type,
    timestamp
  };

  parsingLogs.update(logs => [...logs, log]);

  return id;
}

// Функция для очистки логов
export function clearParsingLogs() {
  parsingLogs.set([]);
}

// Функция для удаления старых логов (оставляем только последние 50)
export function trimParsingLogs(maxLogs: number = 50) {
  parsingLogs.update(logs => {
    if (logs.length > maxLogs) {
      return logs.slice(-maxLogs);
    }
    return logs;
  });
} 