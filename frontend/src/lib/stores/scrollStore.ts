import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

// Store для хранения позиции скролла
export const scrollPosition = writable<ScrollPosition>({ x: 0, y: 0, timestamp: 0 });

// Функция для сохранения текущей позиции скролла
export function saveScrollPosition() {
  if (!browser) return;

  const position = {
    x: window.scrollX,
    y: window.scrollY,
    timestamp: Date.now()
  };

  scrollPosition.set(position);

  // Также сохраняем в sessionStorage для надёжности
  try {
    sessionStorage.setItem('jspulse_scroll_position', JSON.stringify(position));
  } catch (e) {
    console.warn('Failed to save scroll position to sessionStorage:', e);
  }
}

// Функция для восстановления позиции скролла
export function restoreScrollPosition() {
  if (!browser) return;

  let position: ScrollPosition | null = null;

  // Сначала пробуем получить из store
  const currentPosition = get(scrollPosition);
  if (currentPosition.timestamp > 0) {
    position = currentPosition;
  }

  // Если в store нет данных, пробуем sessionStorage
  if (!position || position.timestamp === 0) {
    try {
      const saved = sessionStorage.getItem('jspulse_scroll_position');
      if (saved) {
        const parsedPosition = JSON.parse(saved) as ScrollPosition;
        position = parsedPosition;
      }
    } catch (e) {
      console.warn('Failed to restore scroll position from sessionStorage:', e);
    }
  }

  // Восстанавливаем позицию, если она есть и не слишком старая (максимум 30 минут)
  if (position && position.timestamp && (Date.now() - position.timestamp) < 30 * 60 * 1000) {
    // Немедленное восстановление без анимации и задержки
    window.scrollTo(position.x, position.y);
  }
}

// Функция для очистки сохранённой позиции
export function clearScrollPosition() {
  scrollPosition.set({ x: 0, y: 0, timestamp: 0 });

  if (browser) {
    try {
      sessionStorage.removeItem('jspulse_scroll_position');
    } catch (e) {
      console.warn('Failed to clear scroll position from sessionStorage:', e);
    }
  }
} 