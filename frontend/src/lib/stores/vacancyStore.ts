import { writable } from 'svelte/store';
import type { VacancyWithHtml } from '@jspulse/shared';
import { PAGINATION } from '../config/pagination.constants';
import { browser } from '$app/environment';

/**
 * Интерфейс состояния вакансий для хранения в store
 */
export interface VacancyState {
  vacancies: VacancyWithHtml[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  selectedSkills: string[];
}

// Начальное состояние
const initialState: VacancyState = {
  vacancies: [],
  total: 0,
  totalPages: 0,
  page: 0,
  limit: 10,
  loading: false,
  error: null,
  selectedSkills: []
};

// Ключ для localStorage
const VACANCY_STATE_STORAGE_KEY = 'jspulse_vacancy_state';

// Функция для сохранения состояния в localStorage
function saveStateToStorage(state: VacancyState) {
  if (!browser) return;

  try {
    // Сохраняем только критически важные поля для восстановления
    const stateToSave = {
      vacancies: state.vacancies,
      total: state.total,
      totalPages: state.totalPages,
      page: state.page,
      limit: state.limit,
      selectedSkills: state.selectedSkills,
      timestamp: Date.now()
    };
    localStorage.setItem(VACANCY_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.warn('Failed to save vacancy state to localStorage:', error);
  }
}

// Функция для восстановления состояния из localStorage
function loadStateFromStorage(): Partial<VacancyState> | null {
  if (!browser) return null;

  try {
    const saved = localStorage.getItem(VACANCY_STATE_STORAGE_KEY);
    if (!saved) return null;

    const parsedState = JSON.parse(saved);

    // Проверяем возраст данных (максимум 30 минут)
    if (parsedState.timestamp && (Date.now() - parsedState.timestamp) > 30 * 60 * 1000) {
      localStorage.removeItem(VACANCY_STATE_STORAGE_KEY);
      return null;
    }

    // Возвращаем только данные, исключая служебные поля
    const { timestamp, ...stateData } = parsedState;
    return stateData;
  } catch (error) {
    console.warn('Failed to load vacancy state from localStorage:', error);
    return null;
  }
}

// Функция для очистки сохраненного состояния
function clearStoredState() {
  if (!browser) return;

  try {
    localStorage.removeItem(VACANCY_STATE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear vacancy state from localStorage:', error);
  }
}

// Создаем store
const { subscribe, set, update } = writable<VacancyState>(initialState);

// Вспомогательные функции для работы с store
function setVacancies(vacancies: VacancyWithHtml[], total: number, totalPages: number, page: number) {
  update(state => {
    const newState = {
      ...state,
      vacancies,
      total,
      totalPages,
      page
    };
    saveStateToStorage(newState);
    return newState;
  });
}

function appendVacancies(newVacancies: VacancyWithHtml[], total: number, totalPages: number, page: number) {
  update(state => {
    const newState = {
      ...state,
      vacancies: [...state.vacancies, ...newVacancies],
      total,
      totalPages,
      page
    };
    saveStateToStorage(newState);
    return newState;
  });
}

function setLoading(loading: boolean) {
  update(state => ({ ...state, loading }));
}

function setError(error: string | null) {
  update(state => ({ ...state, error }));
}

function setSkills(skills: string[]) {
  update(state => {
    const newState = { ...state, selectedSkills: skills };
    saveStateToStorage(newState);
    return newState;
  });
}

function setPageSize(size: number) {
  update(state => {
    const newState = { ...state, limit: size };
    saveStateToStorage(newState);
    return newState;
  });
}

function reset() {
  clearStoredState();
  set({ ...initialState });
}

// Функция для восстановления состояния (используется при навигации)
function restoreState(): boolean {
  const savedState = loadStateFromStorage();
  if (!savedState) return false;

  update(state => ({
    ...state,
    ...savedState,
    loading: false,
    error: null
  }));

  return true;
}

// Экспортируем store с дополнительными методами
export const vacancyStore = {
  subscribe,
  setVacancies,
  appendVacancies,
  setLoading,
  setError,
  setSkills,
  setPageSize,
  reset,
  restoreState,
  clearStoredState
}; 