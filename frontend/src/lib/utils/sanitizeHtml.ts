import DOMPurify from 'dompurify';

/**
 * Функция для безопасной очистки HTML
 */
export function sanitizeHtml(html: string): string {
  // Если мы на стороне сервера (Node.js)
  if (typeof window === 'undefined') {
    try {
      // Используем jsdom для создания объекта window
      const { JSDOM } = require('jsdom');
      const window = new JSDOM('').window;
      const purify = DOMPurify(window);
      return purify.sanitize(html);
    } catch (error) {
      console.error('Ошибка при санитизации HTML на сервере:', error);
      // Вернуть плейнтекст как запасной вариант
      return html.replace(/<[^>]*>/g, '');
    }
  } 
  // Если мы на стороне клиента (браузер)
  else {
    return DOMPurify.sanitize(html);
  }
} 