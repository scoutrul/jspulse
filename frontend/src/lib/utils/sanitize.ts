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
  return DescriptionProcessor.sanitizeHtml(html);
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
  return DescriptionProcessor.stripHtml(html);
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
  return new DescriptionProcessor().generateSmartPreview(text, maxLength);
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
  const basicSanitized = DescriptionProcessor.sanitizeHtml(html);
  if (!adaptForDesignSystem) {
    return basicSanitized;
  }
  const processor = new DescriptionProcessor();
  return processor.serializeForDesignSystem(basicSanitized);
} 