/**
 * Утилиты для санитизации и обработки HTML контента
 * Расширенная версия с поддержкой системы обработки описаний JSPulse
 */

import { DescriptionProcessor } from '../services/DescriptionProcessor';

/**
 * Основная функция санитизации описания вакансии
 * Удаляет потенциально опасные теги, но сохраняет базовое форматирование
 * 
 * @param html HTML строка для санитизации
 * @returns Санитизированная HTML строка
 */
export function sanitizeDescription(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Список разрешенных тегов для описания вакансий
  const allowedTags = [
    'p', 'br', 'div', 'span',
    'strong', 'b', 'em', 'i', 'u',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote',
    'a'
  ];

  // Список разрешенных атрибутов
  const allowedAttributes = [
    'href', 'target', 'rel'
  ];

  // Простая санитизация - удаляем все теги кроме разрешенных
  let sanitized = html;

  // Удаляем script теги и их содержимое
  sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Удаляем style теги и их содержимое
  sanitized = sanitized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Удаляем потенциально опасные атрибуты
  sanitized = sanitized.replace(/(on\w+|javascript:)/gi, '');

  // Нормализуем ссылки
  sanitized = sanitized.replace(/<a([^>]*?)>/gi, (match, attrs) => {
    // Добавляем безопасные атрибуты для внешних ссылок
    if (attrs.includes('href')) {
      return `<a${attrs} target="_blank" rel="noopener noreferrer">`;
    }
    return match;
  });

  // Очищаем лишние пробелы и переносы
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Простая функция для удаления всех HTML тегов
 * Используется для создания plain text версии
 * 
 * @param html HTML строка
 * @returns Чистый текст без HTML тегов
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Функция для обрезки текста до определенной длины
 * Сохраняет целостность слов
 * 
 * @param text Исходный текст
 * @param maxLength Максимальная длина
 * @returns Обрезанный текст с многоточием при необходимости
 */
export function truncateText(text: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  // Обрезаем по словам
  const truncated = text.slice(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.slice(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
}

/**
 * Интеллектуальная обработка описания с использованием DescriptionProcessor
 * 
 * @param html HTML описание
 * @param mode Режим обработки: 'preview' или 'full'
 * @param maxPreviewLength Максимальная длина превью
 * @returns Обработанное описание
 */
export function processDescription(
  html: string,
  mode: 'preview' | 'full' = 'preview',
  maxPreviewLength: number = 200
): string {
  if (!html) return '';

  const processor = new DescriptionProcessor();
  return processor.processHtml(html, mode);
}

/**
 * Создает полный объект описания с различными представлениями
 * 
 * @param rawHtml Исходный HTML
 * @returns Объект с различными версиями описания
 */
export function createDescriptionVariants(rawHtml: string) {
  if (!rawHtml) {
    return {
      raw: '',
      preview: '',
      processed: '',
      textOnly: ''
    };
  }

  const processor = new DescriptionProcessor();
  return processor.createDescriptionContent(rawHtml);
}

/**
 * Безопасная санитизация с адаптацией под дизайн-систему
 * Интегрирует старую функциональность с новым DescriptionProcessor
 * 
 * @param html HTML для обработки
 * @param adaptForDesignSystem Применять ли адаптацию под дизайн-систему
 * @returns Санитизированный HTML
 */
export function advancedSanitizeDescription(
  html: string,
  adaptForDesignSystem: boolean = true
): string {
  if (!html) return '';

  // Сначала базовая санитизация
  const basicSanitized = sanitizeDescription(html);

  if (!adaptForDesignSystem) {
    return basicSanitized;
  }

  // Затем адаптация под дизайн-систему
  const processor = new DescriptionProcessor();
  return processor.serializeForDesignSystem(basicSanitized);
} 