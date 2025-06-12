import { writable, get } from 'svelte/store';
import type { VacancyWithHtml } from '@jspulse/shared';
import { PAGINATION } from '../config/pagination.constants';

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
  // Новые поля для гибкой пагинации
  availablePageSizes: number[];
  paginationMode: 'replace' | 'append'; // replace для классической пагинации, append для "load more"
}

const initialState: VacancyState = {
  vacancies: [],
  total: 0,
  page: 0,
  limit: PAGINATION.DEFAULT_PAGE_SIZE,
  totalPages: 0,
  selectedSkills: [],
  loading: false,
  error: null,
  availablePageSizes: [...PAGINATION.AVAILABLE_PAGE_SIZES],
  paginationMode: 'replace',
};

/**
 * Создает store для управления состоянием вакансий
 */
function createVacancyStore() {
  const { subscribe, set, update } = writable<VacancyState>(initialState);

  const store = {
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
    reset: () => set(initialState),

    // Новые методы для гибкой пагинации

    // Переход к конкретной странице (заменяет все вакансии)
    goToPage: (page: number) => update(state => ({
      ...state,
      page,
      paginationMode: 'replace'
    })),

    // Изменение размера страницы
    setPageSize: (limit: number) => update(state => {
      // При изменении размера страницы, пересчитываем текущую страницу
      // чтобы показать примерно те же элементы
      const currentFirstItem = state.page * state.limit;
      const newPage = Math.floor(currentFirstItem / limit);
      const newTotalPages = Math.ceil(state.total / limit);

      return {
        ...state,
        limit,
        page: Math.min(newPage, Math.max(0, newTotalPages - 1)),
        totalPages: newTotalPages,
        paginationMode: 'replace'
      };
    }),

    // Увеличить размер страницы для "показать еще"
    increasePageSize: () => update(state => {
      let newLimit = state.limit;

      if (newLimit < PAGINATION.PROGRESSIVE_STEPS.STEP_2) {
        newLimit = PAGINATION.PROGRESSIVE_STEPS.STEP_2; // 10 -> 20
      } else if (newLimit < PAGINATION.PROGRESSIVE_STEPS.STEP_3) {
        newLimit = PAGINATION.PROGRESSIVE_STEPS.STEP_3; // 20 -> 30
      } else if (newLimit < PAGINATION.PROGRESSIVE_STEPS.STEP_4) {
        newLimit = PAGINATION.PROGRESSIVE_STEPS.STEP_4; // 30 -> 50
      } else if (newLimit < 100) {
        newLimit = 100; // 50 -> 100
      } else {
        newLimit += PAGINATION.PROGRESSIVE_STEPS.INCREMENTAL; // 100+ -> +50
      }

      const newTotalPages = Math.ceil(state.total / newLimit);

      return {
        ...state,
        limit: newLimit,
        totalPages: newTotalPages,
        page: 0, // Сброс на первую страницу
        paginationMode: 'replace'
      };
    }),

    // Установить режим пагинации
    setPaginationMode: (mode: 'replace' | 'append') => update(state => ({
      ...state,
      paginationMode: mode
    })),

    // Сохранить настройки пагинации в localStorage
    savePaginationSettings: () => {
      const currentState = get({ subscribe });
      try {
        const settings = {
          limit: currentState.limit,
          paginationMode: currentState.paginationMode
        };
        localStorage.setItem('jspulse-pagination-settings', JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save pagination settings to localStorage:', error);
      }
    },

    // Загрузить настройки пагинации из localStorage
    loadPaginationSettings: () => update(state => {
      try {
        const saved = localStorage.getItem('jspulse-pagination-settings');
        if (saved) {
          const settings = JSON.parse(saved);
          return {
            ...state,
            limit: settings.limit || state.limit,
            paginationMode: settings.paginationMode || state.paginationMode
          };
        }
      } catch (error) {
        console.warn('Failed to load pagination settings from localStorage:', error);
      }
      return state;
    }),

    // Синхронизация с URL параметрами
    syncWithURL: (searchParams: URLSearchParams) => update(state => {
      const page = parseInt(searchParams.get('page') || '0');
      const limit = parseInt(searchParams.get('limit') || state.limit.toString());
      const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];

      return {
        ...state,
        page: Math.max(0, page),
        limit: state.availablePageSizes.includes(limit) ? limit : state.limit,
        selectedSkills: skills,
        paginationMode: 'replace'
      };
    }),

    // Получить параметры для URL
    getURLParams: (): string => {
      const currentState = get({ subscribe });
      const params = new URLSearchParams();

      if (currentState.page > 0) {
        params.set('page', currentState.page.toString());
      }

      if (currentState.limit !== PAGINATION.DEFAULT_PAGE_SIZE) {
        params.set('limit', currentState.limit.toString());
      }

      if (currentState.selectedSkills.length > 0) {
        params.set('skills', currentState.selectedSkills.join(','));
      }

      return params.toString();
    }
  };

  return store;
}

export const vacancyStore = createVacancyStore(); 