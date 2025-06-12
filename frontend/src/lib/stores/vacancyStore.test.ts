import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { vacancyStore } from './vacancyStore';
import type { VacancyWithHtml } from '@jspulse/shared';

// Мок функция для создания тестовых вакансий
function createMockVacancy(id: string, overrides: Partial<VacancyWithHtml> = {}): VacancyWithHtml {
  return {
    _id: id,
    externalId: `ext_${id}`,
    title: `Test Vacancy ${id}`,
    company: 'Test Company',
    location: 'Москва',
    url: 'https://example.com',
    skills: ['JavaScript'],
    description: 'Test description',
    publishedAt: new Date('2024-01-01'),
    source: 'test',
    ...overrides
  };
}

describe('vacancyStore', () => {
  beforeEach(() => {
    vacancyStore.reset();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = get(vacancyStore);

      expect(state).toEqual({
        vacancies: [],
        total: 0,
        page: 0,
        limit: 10,
        totalPages: 0,
        selectedSkills: [],
        loading: false,
        error: null
      });
    });
  });

  describe('setSkills', () => {
    it('should set skills', () => {
      const mockVacancies = [createMockVacancy('1'), createMockVacancy('2')];

      // Set initial state with vacancies
      vacancyStore.setVacancies(mockVacancies, 2, 1, 1);

      // Set new skills
      vacancyStore.setSkills(['TypeScript', 'React']);

      const state = get(vacancyStore);
      expect(state.selectedSkills).toEqual(['TypeScript', 'React']);
    });

    it('should handle empty skills array', () => {
      vacancyStore.setSkills([]);

      const state = get(vacancyStore);
      expect(state.selectedSkills).toEqual([]);
    });
  });

  describe('setVacancies', () => {
    it('should set vacancies with pagination info', () => {
      const mockVacancies = [createMockVacancy('1'), createMockVacancy('2')];

      vacancyStore.setVacancies(mockVacancies, 100, 10, 1);

      const state = get(vacancyStore);
      expect(state.vacancies).toEqual(mockVacancies);
      expect(state.total).toBe(100);
      expect(state.totalPages).toBe(10);
      expect(state.page).toBe(1);
    });

    it('should replace existing vacancies', () => {
      const firstVacancies = [createMockVacancy('1')];
      const secondVacancies = [createMockVacancy('2'), createMockVacancy('3')];

      vacancyStore.setVacancies(firstVacancies, 1, 1, 1);
      vacancyStore.setVacancies(secondVacancies, 2, 1, 1);

      const state = get(vacancyStore);
      expect(state.vacancies).toEqual(secondVacancies);
      expect(state.total).toBe(2);
    });
  });

  describe('appendVacancies', () => {
    it('should append new vacancies to existing ones', () => {
      const firstVacancies = [createMockVacancy('1'), createMockVacancy('2')];
      const newVacancies = [createMockVacancy('3'), createMockVacancy('4')];

      vacancyStore.setVacancies(firstVacancies, 2, 1, 1);
      vacancyStore.appendVacancies(newVacancies, 4, 2, 2);

      const state = get(vacancyStore);
      expect(state.vacancies).toHaveLength(4);
      expect(state.vacancies[0]._id).toBe('1');
      expect(state.vacancies[2]._id).toBe('3');
      expect(state.total).toBe(4);
      expect(state.totalPages).toBe(2);
      expect(state.page).toBe(2);
    });

    it('should handle appending to empty vacancies list', () => {
      const newVacancies = [createMockVacancy('1')];

      vacancyStore.appendVacancies(newVacancies, 1, 1, 1);

      const state = get(vacancyStore);
      expect(state.vacancies).toEqual(newVacancies);
      expect(state.total).toBe(1);
    });
  });

  describe('setLoading', () => {
    it('should set loading state to true', () => {
      vacancyStore.setLoading(true);

      const state = get(vacancyStore);
      expect(state.loading).toBe(true);
    });

    it('should set loading state to false', () => {
      vacancyStore.setLoading(true);
      vacancyStore.setLoading(false);

      const state = get(vacancyStore);
      expect(state.loading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const errorMessage = 'Failed to load vacancies';

      vacancyStore.setError(errorMessage);

      const state = get(vacancyStore);
      expect(state.error).toBe(errorMessage);
    });

    it('should clear error by setting null', () => {
      vacancyStore.setError('Some error');
      vacancyStore.setError(null);

      const state = get(vacancyStore);
      expect(state.error).toBeNull();
    });
  });

  describe('setPageSize', () => {
    it('should set page size', () => {
      vacancyStore.setPageSize(20);

      const state = get(vacancyStore);
      expect(state.limit).toBe(20);
    });

    it('should update page size multiple times', () => {
      vacancyStore.setPageSize(30);
      vacancyStore.setPageSize(50);

      const state = get(vacancyStore);
      expect(state.limit).toBe(50);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      const mockVacancies = [createMockVacancy('1')];

      // Modify state
      vacancyStore.setVacancies(mockVacancies, 1, 1, 1);
      vacancyStore.setSkills(['React']);
      vacancyStore.setLoading(true);
      vacancyStore.setError('Some error');

      // Reset
      vacancyStore.reset();

      const state = get(vacancyStore);
      expect(state).toEqual({
        vacancies: [],
        total: 0,
        page: 0,
        limit: 10,
        totalPages: 0,
        selectedSkills: [],
        loading: false,
        error: null
      });
    });
  });

  describe('store reactivity', () => {
    it('should trigger updates when store changes', () => {
      const states: any[] = [];

      const unsubscribe = vacancyStore.subscribe(state => {
        states.push({ ...state });
      });

      vacancyStore.setLoading(true);
      vacancyStore.setSkills(['React']);

      unsubscribe();

      expect(states).toHaveLength(3); // initial + 2 updates
      expect(states[1].loading).toBe(true);
      expect(states[2].selectedSkills).toEqual(['React']);
    });
  });
}); 