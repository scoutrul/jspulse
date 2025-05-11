import { writable } from 'svelte/store';
import type { VacancyWithHtml } from '@jspulse/shared';

/**
 * Интерфейс состояния вакансий для хранения в store
 */
interface VacancyState {
  vacancies: VacancyWithHtml[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  selectedSkills: string[];
  loading: boolean;
  error: string | null;
}

// Ключ для хранения состояния в localStorage
const STORAGE_KEY = 'vacancyStore';

/**
 * Загружает состояние из localStorage
 */
function loadState(): VacancyState | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Ошибка загрузки состояния из localStorage:', error);
    return undefined;
  }
}

/**
 * Сохраняет состояние в localStorage
 */
function saveState(state: VacancyState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Ошибка сохранения состояния в localStorage:', error);
  }
}

// Начальное состояние (загруженное из localStorage или дефолтное)
const initialState: VacancyState = loadState() || {
  vacancies: [],
  total: 0,
  page: 0,
  limit: 10,
  totalPages: 0,
  selectedSkills: [],
  loading: false,
  error: null,
};

/**
 * Создает store для управления состоянием вакансий с сохранением в localStorage
 * и синхронизацией между вкладками
 */
function createVacancyStore() {
  const { subscribe, set, update } = writable<VacancyState>(initialState);

  // Обработчик события storage для синхронизации между вкладками
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          set(newState);
        } catch (e) {
          console.error('Ошибка парсинга данных из события storage:', e);
        }
      }
    });
  }

  // Подписка на изменения состояния для автоматического сохранения
  const unsubscribe = subscribe((state) => {
    saveState(state);
  });

  return {
    subscribe,

    // Инициализация начальными данными (сброс)
    init: (data: Partial<VacancyState>) => update(state => {
      // Если данные уже есть в localStorage и не было явного сброса, 
      // сохраняем текущие данные для свойств, которые не переданы явно
      if (loadState() && !data.vacancies) {
        return { ...state, ...data };
      }
      return { ...state, ...data };
    }),

    // Применить фильтр по навыкам
    setSkills: (skills: string[]) => update(state => ({
      ...state,
      selectedSkills: skills,
      page: 0,
      vacancies: []
    })),

    // Установить вакансии (после фильтрации или первой загрузки)
    setVacancies: (vacancies: VacancyWithHtml[], total: number, totalPages: number, page: number) =>
      update(state => ({ ...state, vacancies, total, totalPages, page })),

    // Добавить вакансии (пагинация)
    appendVacancies: (newVacancies: VacancyWithHtml[], total: number, totalPages: number, page: number) =>
      update(state => ({
        ...state,
        vacancies: [...state.vacancies, ...newVacancies],
        total,
        totalPages,
        page
      })),

    // Установить состояние загрузки
    setLoading: (loading: boolean) => update(state => ({ ...state, loading })),

    // Установить состояние ошибки
    setError: (error: string | null) => update(state => ({ ...state, error })),

    // Сбросить состояние
    reset: () => set(initialState),

    // Очистить ресурсы (отписаться от событий)
    dispose: () => unsubscribe(),
  };
}

export const vacancyStore = createVacancyStore(); 