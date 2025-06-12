import { writable } from 'svelte/store';
import type { VacancyWithHtml } from '@jspulse/shared';
import { PAGINATION } from '../config/pagination.constants';

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

// Создаем store
const { subscribe, set, update } = writable<VacancyState>(initialState);

// Вспомогательные функции для работы с store
function setVacancies(vacancies: VacancyWithHtml[], total: number, totalPages: number, page: number) {
  update(state => ({
    ...state,
    vacancies,
    total,
    totalPages,
    page
  }));
}

function appendVacancies(newVacancies: VacancyWithHtml[], total: number, totalPages: number, page: number) {
  update(state => ({
    ...state,
    vacancies: [...state.vacancies, ...newVacancies],
    total,
    totalPages,
    page
  }));
}

function setLoading(loading: boolean) {
  update(state => ({ ...state, loading }));
}

function setError(error: string | null) {
  update(state => ({ ...state, error }));
}

function setSkills(skills: string[]) {
  update(state => ({ ...state, selectedSkills: skills }));
}

function setPageSize(size: number) {
  update(state => ({ ...state, limit: size }));
}

function reset() {
  set({ ...initialState });
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
  reset
}; 