import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VacancyService } from './vacancy.service';
import { vacancyApi } from '$lib/api/vacancy.api';
import type { VacancyDTO } from '@jspulse/shared';

// Mock the API module
vi.mock('$lib/api/vacancy.api', () => ({
  vacancyApi: {
    fetchSkills: vi.fn(),
    fetchVacancyById: vi.fn(),
    fetchVacancies: vi.fn()
  }
}));

// Mock logger to prevent console noise in tests
vi.mock('$lib/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn()
  }
}));

describe('VacancyService', () => {
  let service: VacancyService;

  beforeEach(() => {
    service = new VacancyService();
    vi.clearAllMocks();
  });

  describe('fetchSkillsClient', () => {
    it('should return skills from API', async () => {
      const mockSkills = ['JavaScript', 'TypeScript', 'React'];
      vi.mocked(vacancyApi.fetchSkills).mockResolvedValue(mockSkills);

      const result = await service.fetchSkillsClient();

      expect(result).toEqual(mockSkills);
      expect(vacancyApi.fetchSkills).toHaveBeenCalledOnce();
    });

    it('should return empty array when API throws error', async () => {
      vi.mocked(vacancyApi.fetchSkills).mockRejectedValue(new Error('API Error'));

      const result = await service.fetchSkillsClient();

      expect(result).toEqual([]);
      expect(vacancyApi.fetchSkills).toHaveBeenCalledOnce();
    });
  });

  describe('fetchVacancyByIdClient', () => {
    const mockVacancy: VacancyDTO = {
      _id: '64a7f8b9c123456789012345',
      externalId: 'ext_12345',
      title: 'Frontend Developer',
      company: 'Tech Corp',
      location: 'Москва',
      description: 'Great job opportunity',
      skills: ['JavaScript', 'React'],
      source: 'hh.ru',
      url: 'https://example.com/vacancy',
      publishedAt: new Date('2024-01-01')
    };

    it('should return vacancy when found', async () => {
      vi.mocked(vacancyApi.fetchVacancyById).mockResolvedValue(mockVacancy);

      const result = await service.fetchVacancyByIdClient('64a7f8b9c123456789012345');

      expect(result).toEqual(mockVacancy);
      expect(vacancyApi.fetchVacancyById).toHaveBeenCalledWith('64a7f8b9c123456789012345');
    });

    it('should return null when vacancy not found', async () => {
      vi.mocked(vacancyApi.fetchVacancyById).mockRejectedValue(new Error('Not found'));

      const result = await service.fetchVacancyByIdClient('non-existent-id');

      expect(result).toBeNull();
      expect(vacancyApi.fetchVacancyById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('fetchVacanciesClient', () => {
    const mockApiResponse = {
      vacancies: [
        {
          _id: '64a7f8b9c123456789012345',
          externalId: 'ext_12345',
          title: 'Frontend Developer',
          company: 'Tech Corp',
          location: 'Москва',
          description: 'Great job opportunity',
          skills: ['JavaScript', 'React'],
          source: 'hh.ru',
          url: 'https://example.com/vacancy',
          publishedAt: new Date('2024-01-01')
        }
      ],
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10
    };

    it('should return formatted response with vacancies', async () => {
      vi.mocked(vacancyApi.fetchVacancies).mockResolvedValue(mockApiResponse);

      const params = { page: 1, limit: 10, skills: ['JavaScript'] };
      const result = await service.fetchVacanciesClient(params);

      expect(result).toEqual({
        vacancies: mockApiResponse.vacancies,
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10
      });
      expect(vacancyApi.fetchVacancies).toHaveBeenCalledWith(params);
    });

    it('should return empty result with error when API fails', async () => {
      const error = new Error('Network error');
      vi.mocked(vacancyApi.fetchVacancies).mockRejectedValue(error);

      const params = { page: 1, limit: 10 };
      const result = await service.fetchVacanciesClient(params);

      expect(result).toEqual({
        vacancies: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        error: 'Network error'
      });
    });

    it('should handle unknown error types', async () => {
      vi.mocked(vacancyApi.fetchVacancies).mockRejectedValue('String error');

      const params = { page: 1, limit: 10 };
      const result = await service.fetchVacanciesClient(params);

      expect(result).toEqual({
        vacancies: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        error: 'Неизвестная ошибка при загрузке вакансий'
      });
    });

    it('should handle missing optional params', async () => {
      vi.mocked(vacancyApi.fetchVacancies).mockResolvedValue(mockApiResponse);

      const params = {};
      const result = await service.fetchVacanciesClient(params);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(vacancyApi.fetchVacancies).toHaveBeenCalledWith(params);
    });
  });
}); 