import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { DEFAULT_THEME, THEME_STORAGE_KEY, type Theme } from '$lib/constants/theme';

// Экспортируем константы для использования в других компонентах
export { DEFAULT_THEME, THEME_STORAGE_KEY, type Theme };

// Функция для получения сохраненной темы или системной темы по умолчанию
function getInitialTheme(): Theme {
  if (!browser) return DEFAULT_THEME;

  // Проверяем сохраненную тему в localStorage
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
  } catch (error) {
    console.warn('Не удалось получить тему из localStorage:', error);
  }

  // Если нет сохраненной темы, используем темную тему по умолчанию
  return DEFAULT_THEME;
}

// Создаем стор с начальной темой
export const theme = writable<Theme>(getInitialTheme());

// Функция для переключения темы
export function toggleTheme() {
  theme.update(currentTheme => {
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';

    // Сохраняем в localStorage
    if (browser) {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);

      // Добавляем/убираем класс dark на html элементе для глобальных стилей
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    return newTheme;
  });
}

// Функция для установки конкретной темы
export function setTheme(newTheme: Theme) {
  theme.set(newTheme);

  if (browser) {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

// Инициализация темы при загрузке
if (browser) {
  // Класс уже установлен в app.html, просто синхронизируем стор
  const initialTheme = getInitialTheme();

  // Убеждаемся что DOM и стор синхронизированы
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Слушаем изменения системной темы
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    // Обновляем тему только если пользователь не установил свою предпочтительную тему
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (!savedTheme) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
} 