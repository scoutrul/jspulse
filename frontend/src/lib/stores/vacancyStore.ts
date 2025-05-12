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

const initialState: VacancyState = {
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
 * Создает store для управления состоянием вакансий
 */
function createVacancyStore() {
  const { subscribe, set, update } = writable<VacancyState>(initialState);

  return {
    subscribe,

    // Инициализация начальными данными (сброс)
    init: (data: Partial<VacancyState>) => update(state => {
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
    reset: () => set(initialState)
  };
}

export const vacancyStore = createVacancyStore(); 