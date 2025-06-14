import type { DescriptionContent } from '@jspulse/shared/types';

/**
 * Сервис для обработки описаний вакансий
 * Обеспечивает интеллектуальную обрезку, HTML-сериализацию и адаптацию под дизайн-систему JSPulse
 */
export class DescriptionProcessor {
  private static readonly DEFAULT_PREVIEW_LENGTH = 200;
  private static readonly SENTENCE_ENDINGS = ['.', '!', '?', ':', ';'];
  private static readonly WORD_BREAK_CHARS = [' ', '\n', '\t', '\r'];

  /**
   * Генерирует умное превью описания с сохранением смысловой целостности
   */
  generateSmartPreview(html: string, maxLength: number = DescriptionProcessor.DEFAULT_PREVIEW_LENGTH): string {
    if (!html || html.length <= maxLength) {
      return html;
    }

    // Удаляем HTML теги для анализа текста
    const textOnly = this.stripHtml(html);

    if (textOnly.length <= maxLength) {
      return textOnly;
    }

    // Обрезаем до максимальной длины
    let truncated = textOnly.slice(0, maxLength);

    // Ищем ближайшую границу предложения (в пределах 80% от максимальной длины)
    const minLength = Math.floor(maxLength * 0.8);
    for (let i = truncated.length - 1; i >= minLength; i--) {
      if (DescriptionProcessor.SENTENCE_ENDINGS.includes(truncated[i])) {
        return truncated.slice(0, i + 1);
      }
    }

    // Если не нашли границу предложения, ищем границу слова
    for (let i = truncated.length - 1; i >= minLength; i--) {
      if (DescriptionProcessor.WORD_BREAK_CHARS.includes(truncated[i])) {
        return truncated.slice(0, i) + '...';
      }
    }

    // В крайнем случае просто обрезаем и добавляем многоточие
    return truncated + '...';
  }

  /**
   * Сериализует HTML под дизайн-систему JSPulse
   */
  serializeForDesignSystem(html: string): string {
    if (!html) return '';

    return html
      // Заголовки - адаптируем под градиентную систему JSPulse
      .replace(/<h1([^>]*)>/g, '<h3 class="description-heading description-heading--large"$1>')
      .replace(/<h2([^>]*)>/g, '<h3 class="description-heading description-heading--medium"$1>')
      .replace(/<h3([^>]*)>/g, '<h3 class="description-heading description-heading--small"$1>')
      .replace(/<\/h[1-6]>/g, '</h3>')

      // Параграфы
      .replace(/<p([^>]*)>/g, '<p class="description-paragraph"$1>')

      // Списки
      .replace(/<ul([^>]*)>/g, '<ul class="description-list"$1>')
      .replace(/<ol([^>]*)>/g, '<ol class="description-list description-list--ordered"$1>')
      .replace(/<li([^>]*)>/g, '<li class="description-item"$1>')

      // Выделение текста
      .replace(/<strong([^>]*)>/g, '<strong class="description-emphasis"$1>')
      .replace(/<b([^>]*)>/g, '<strong class="description-emphasis"$1>')
      .replace(/<em([^>]*)>/g, '<em class="description-emphasis--italic"$1>')
      .replace(/<i([^>]*)>/g, '<em class="description-emphasis--italic"$1>')

      // Ссылки - добавляем безопасные атрибуты
      .replace(/<a\s+([^>]*href=["'][^"']*["'][^>]*)>/g, '<a class="description-link" $1 target="_blank" rel="noopener noreferrer">')

      // Цитаты
      .replace(/<blockquote([^>]*)>/g, '<blockquote class="description-quote"$1>');
  }

  /**
   * Полная обработка HTML с санитизацией и адаптацией
   */
  processHtml(html: string, mode: 'preview' | 'full' = 'full'): string {
    if (!html) return '';

    // Сначала санитизируем HTML
    const sanitized = this.sanitizeHtml(html);

    if (mode === 'preview') {
      // Для превью генерируем текстовую версию
      return this.generateSmartPreview(sanitized);
    }

    // Для полной версии сериализуем под дизайн-систему
    return this.serializeForDesignSystem(sanitized);
  }

  /**
   * Создает полный объект DescriptionContent
   */
  createDescriptionContent(rawHtml: string): DescriptionContent {
    const processed = this.serializeForDesignSystem(rawHtml);
    const preview = this.generateSmartPreview(rawHtml);
    const textOnly = this.stripHtml(rawHtml);

    return {
      raw: rawHtml,
      preview,
      processed,
      textOnly
    };
  }

  /**
   * Удаляет HTML теги, оставляя только текст
   */
  private stripHtml(html: string): string {
    if (!html) return '';

    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Удаляем script теги
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Удаляем style теги
      .replace(/<[^>]*>/g, '')                          // Удаляем все HTML теги
      .replace(/&nbsp;/g, ' ')                          // Заменяем неразрывные пробелы
      .replace(/&amp;/g, '&')                           // Декодируем HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')                             // Нормализуем пробелы
      .trim();
  }

  /**
   * Базовая санитизация HTML (расширяет существующую функциональность)
   */
  private sanitizeHtml(html: string): string {
    if (!html) return '';

    // Список разрешенных тегов для описания вакансий
    const allowedTags = [
      'p', 'br', 'div', 'span',
      'strong', 'b', 'em', 'i', 'u',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'a'
    ];

    let sanitized = html;

    // Удаляем потенциально опасные элементы
    sanitized = sanitized
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/(on\w+|javascript:)/gi, '');

    // Нормализуем ссылки для безопасности
    sanitized = sanitized.replace(/<a([^>]*?)>/gi, (match, attrs) => {
      if (attrs.includes('href')) {
        return `<a${attrs}>`;
      }
      return match;
    });

    return sanitized.trim();
  }
} 