import type { DescriptionContent } from "../types/DescriptionContent.js";

/**
 * Сервис для обработки описаний вакансий на бэкенде
 * Интегрируется с HH.ru парсером и подготавливает данные для фронтенда
 */
export class DescriptionService {

  /**
   * Обрабатывает полное HTML описание и создает различные представления
   */
  static processFullDescription(
    rawHtml: string,
    shortDescription?: string
  ): DescriptionContent {
    if (!rawHtml && !shortDescription) {
      return {
        raw: '',
        preview: 'Описание отсутствует',
        processed: '',
        textOnly: ''
      };
    }

    // Используем полное описание, если доступно, иначе краткое
    const sourceHtml = rawHtml || shortDescription || '';

    // Базовая санитизация HTML
    const sanitized = this.sanitizeHtml(sourceHtml);

    // Генерируем превью из полного описания
    const preview = this.generatePreview(sanitized, 200);

    // Создаем версию только с текстом
    const textOnly = this.stripHtmlTags(sanitized);

    return {
      raw: sourceHtml,
      preview,
      processed: sanitized,
      textOnly
    };
  }

  /**
   * Создает интеллектуальное превью описания
   * Сохраняет границы предложений и структуру
   */
  private static generatePreview(html: string, maxLength: number = 200): string {
    if (!html) return '';

    // Сначала извлекаем текст из HTML
    const text = this.stripHtmlTags(html);

    if (text.length <= maxLength) {
      return text;
    }

    // Ищем границу предложения в пределах лимита
    const truncated = text.slice(0, maxLength);

    // Ищем последнюю точку, восклицательный или вопросительный знак
    const sentenceEnd = /[.!?]\s/.exec(truncated);
    if (sentenceEnd && sentenceEnd.index > maxLength * 0.6) {
      return text.slice(0, sentenceEnd.index + 1).trim();
    }

    // Если нет границ предложений, ищем границы слов
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      return text.slice(0, lastSpace).trim() + '…';
    }

    return truncated.trim() + '…';
  }

  /**
   * Базовая санитизация HTML
   * Удаляет опасные теги и атрибуты
   */
  private static sanitizeHtml(html: string): string {
    if (!html) return '';

    // Список разрешенных тегов
    const allowedTags = [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'div', 'span', 'blockquote'
    ];

    // Простая санитизация через регулярные выражения
    let sanitized = html;

    // Удаляем script теги и их содержимое
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '');

    // Удаляем style теги и их содержимое
    sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gis, '');

    // Удаляем опасные атрибуты (onclick, onload, etc.)
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*'[^']*'/gi, '');

    // Удаляем javascript: ссылки
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Базовая очистка HTML сущностей
    sanitized = sanitized.replace(/&lt;/g, '<');
    sanitized = sanitized.replace(/&gt;/g, '>');
    sanitized = sanitized.replace(/&quot;/g, '"');
    sanitized = sanitized.replace(/&amp;/g, '&');

    return sanitized.trim();
  }

  /**
   * Удаляет HTML теги, оставляя только текст
   */
  private static stripHtmlTags(html: string): string {
    if (!html) return '';

    return html
      .replace(/<[^>]+>/g, ' ') // Удаляем все HTML теги
      .replace(/\s+/g, ' ') // Схлопываем множественные пробелы
      .replace(/&nbsp;/g, ' ') // Заменяем неразрывные пробелы
      .replace(/&[#\w]+;/g, '') // Удаляем HTML сущности
      .trim();
  }

  /**
   * Интегрированная обработка для HH.ru вакансий
   * Обрабатывает как краткое, так и полное описание
   */
  static processHHVacancyDescription(data: {
    snippet?: { responsibility?: string; requirement?: string };
    description?: string;
    fullDescription?: string;
  }): {
    description: string;
    fullDescription?: DescriptionContent;
    processedHtml?: string;
  } {
    // Формируем краткое описание из snippet
    const shortDescription =
      data.snippet?.responsibility ||
      data.snippet?.requirement ||
      'Описание отсутствует';

    // Используем полное описание, если доступно
    const fullHtml = data.fullDescription || data.description;

    if (fullHtml) {
      // Если есть полное описание, обрабатываем его
      const processed = this.processFullDescription(fullHtml, shortDescription);

      return {
        description: shortDescription, // Сохраняем краткое для обратной совместимости
        fullDescription: processed,
        processedHtml: processed.processed
      };
    }

    // Если полного описания нет, возвращаем только краткое
    return {
      description: shortDescription
    };
  }
} 