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

  // Поля для адаптивной виртуализации
  virtualWindow: {
    start: number; // Начальный индекс видимого окна
    size: number;  // Размер видимого окна (количество элементов)
    totalLoaded: number; // Общее количество загруженных элементов
  };
  canLoadPrevious: boolean; // Можно ли загрузить предыдущие элементы
  previousPageHistory: Array<{ start: number; size: number }>; // История для отката
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
  availablePageSizes: [10, 20, 30, 50], // Принудительно устанавливаем правильные размеры
  paginationMode: 'replace',
  virtualWindow: {
    start: 0,
    size: 0,
    totalLoaded: 0
  },
  canLoadPrevious: false,
  previousPageHistory: []
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
      update(state => {
        // Фильтруем дубликаты по _id для предотвращения ошибки each_key_duplicate в Svelte
        const existingIds = new Set(state.vacancies.map(v => v._id));
        const uniqueNewVacancies = newVacancies.filter(v => !existingIds.has(v._id));

        return {
          ...state,
          vacancies: [...state.vacancies, ...uniqueNewVacancies],
          total,
          totalPages,
          page
        };
      }),

    // Установить состояние загрузки
    setLoading: (loading: boolean) => update(state => ({ ...state, loading })),

    // Установить состояние ошибки
    setError: (error: string | null) => update(state => ({ ...state, error })),

    // Сбросить состояние
    reset: () => set({
      ...initialState,
      virtualWindow: {
        start: 0,
        size: 0,
        totalLoaded: 0
      },
      canLoadPrevious: false,
      previousPageHistory: []
    }),

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
      } else {
        // Больше 50 не увеличиваем, это максимум
        newLimit = PAGINATION.PROGRESSIVE_STEPS.STEP_4; // максимум 50
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

    // Переход к следующей странице (offset-based пагинация)
    goToNextPage: () => update(state => {
      const nextPage = state.page + 1;
      const maxPage = Math.ceil(state.total / state.limit) - 1;

      return {
        ...state,
        page: Math.min(nextPage, maxPage),
        paginationMode: 'replace'
      };
    }),

    // Проверка режима offset-based пагинации (после 50 элементов)
    isOffsetMode: () => {
      const currentState = get({ subscribe });
      return currentState.limit >= 50 && currentState.total > 50;
    },

    // Установить режим пагинации
    setPaginationMode: (mode: 'replace' | 'append') => update(state => ({
      ...state,
      paginationMode: mode
    })),



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
    },

    // 🚀 Новые методы для адаптивной виртуализации

    // Добавить новые элементы с виртуализацией
    appendVacanciesVirtual: (newVacancies: VacancyWithHtml[], total: number) =>
      update(state => {
        const currentLoaded = state.vacancies.length;

        // Фильтруем дубликаты по _id для предотвращения ошибки each_key_duplicate в Svelte
        const existingIds = new Set(state.vacancies.map(v => v._id));
        const uniqueNewVacancies = newVacancies.filter(v => !existingIds.has(v._id));

        const newSize = uniqueNewVacancies.length;
        const maxWindowSize = 100; // Максимальный размер окна для производительности

        // Если загружаем больше 50 элементов и уже есть много в списке
        if (newSize >= 50 && currentLoaded >= 50) {
          // Сохраняем историю для возможности отката
          const historyEntry = {
            start: state.virtualWindow.start,
            size: state.virtualWindow.size
          };

          // Удаляем старые элементы сверху (столько же сколько добавляем)
          const updatedVacancies = [...state.vacancies.slice(newSize), ...uniqueNewVacancies];

          return {
            ...state,
            vacancies: updatedVacancies,
            total,
            virtualWindow: {
              start: state.virtualWindow.start + newSize,
              size: Math.min(updatedVacancies.length, maxWindowSize),
              totalLoaded: state.virtualWindow.totalLoaded + newSize
            },
            canLoadPrevious: true,
            previousPageHistory: [...state.previousPageHistory, historyEntry]
          };
        } else {
          // Обычное добавление для небольших порций
          return {
            ...state,
            vacancies: [...state.vacancies, ...uniqueNewVacancies],
            total,
            virtualWindow: {
              start: state.virtualWindow.start,
              size: state.vacancies.length + newSize,
              totalLoaded: state.virtualWindow.totalLoaded + newSize
            }
          };
        }
      }),

    // Загрузить предыдущие элементы (откат)
    loadPreviousVirtual: () =>
      update(state => {
        if (!state.canLoadPrevious || state.previousPageHistory.length === 0) {
          return state;
        }

        const lastHistory = state.previousPageHistory[state.previousPageHistory.length - 1];
        const newHistory = state.previousPageHistory.slice(0, -1);

        return {
          ...state,
          virtualWindow: {
            start: lastHistory.start,
            size: lastHistory.size,
            totalLoaded: state.virtualWindow.totalLoaded
          },
          canLoadPrevious: newHistory.length > 0,
          previousPageHistory: newHistory
        };
      }),

    // Сброс виртуализации (при новом поиске)
    resetVirtual: () =>
      update(state => ({
        ...state,
        vacancies: [],
        virtualWindow: {
          start: 0,
          size: 0,
          totalLoaded: 0
        },
        canLoadPrevious: false,
        previousPageHistory: []
      })),

    // Получить информацию о виртуальном окне
    getVirtualInfo: () => {
      const currentState = get({ subscribe });
      return {
        showing: currentState.vacancies.length,
        windowStart: currentState.virtualWindow.start,
        windowEnd: currentState.virtualWindow.start + currentState.vacancies.length,
        totalLoaded: currentState.virtualWindow.totalLoaded,
        canLoadPrevious: currentState.canLoadPrevious,
        hiddenItemsCount: currentState.virtualWindow.start
      };
    }
  };

  return store;
}

export const vacancyStore = createVacancyStore(); 