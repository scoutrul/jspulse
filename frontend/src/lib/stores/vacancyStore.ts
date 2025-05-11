import { writable } from 'svelte/store';
import type { VacancyWithHtml } from '@jspulse/shared';

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

function createVacancyStore() {
  const { subscribe, set, update } = writable<VacancyState>(initialState);

  return {
    subscribe,
    // Инициализация начальными данными
    init: (data: Partial<VacancyState>) => update(state => ({ ...state, ...data })),
    // Применить фильтр
    setSkills: (skills: string[]) => update(state => ({ ...state, selectedSkills: skills, page: 0, vacancies: [] })),
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
    setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
    setError: (error: string | null) => update(state => ({ ...state, error })),
    reset: () => set(initialState),
  };
}

export const vacancyStore = createVacancyStore(); 