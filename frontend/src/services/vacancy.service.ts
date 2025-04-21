import { apiClient, hhClient } from '../api/http.client';
import { API_CONFIG } from '../config/api.config';
import type { Vacancy, HHVacancyType, HHVacancySalary } from '@jspulse/shared';

class VacancyService {
  // Получение вакансий из нашего API
  async getVacancies(): Promise<Vacancy[]> {
    return apiClient.get(API_CONFIG.ENDPOINTS.VACANCIES);
  }

  // Получение вакансий по тегам
  async getVacanciesByTags(tags: string[]): Promise<Vacancy[]> {
    return apiClient.get(`${API_CONFIG.ENDPOINTS.VACANCIES_FILTER}/tags`, {
      params: { tags: tags.join(',') }
    });
  }

  // Получение вакансий напрямую из HH API
  async getHHVacancies(params: {
    text?: string;
    area?: string;
    page?: number;
    per_page?: number;
  }): Promise<Vacancy[]> {
    return hhClient.get(API_CONFIG.HH_API.VACANCIES_ENDPOINT, { params });
  }

  // Преобразование вакансии HH в общий формат
  transformHHVacancy(hhVacancy: HHVacancyType): Vacancy {
    return {
      id: hhVacancy.id,
      title: hhVacancy.name,
      company: hhVacancy.employer.name,
      location: hhVacancy.area.name,
      description: hhVacancy.description || '',
      salary: this.formatSalary(hhVacancy.salary),
      tags: [], // Теги нужно будет извлекать из описания/требований
      url: hhVacancy.alternate_url,
      source: 'hh.ru',
      publishedAt: hhVacancy.published_at,
      area: hhVacancy.area,
      employer: hhVacancy.employer,
      snippet: hhVacancy.snippet
    };
  }

  private formatSalary(salary: HHVacancySalary | null): string | null {
    if (!salary) return null;
    
    const { from, to, currency } = salary;
    if (!from && !to) return null;
    
    if (from && to) {
      return `${from.toLocaleString()} - ${to.toLocaleString()} ${currency}`;
    }
    
    if (from) {
      return `от ${from.toLocaleString()} ${currency}`;
    }
    
    if (to) {
      return `до ${to.toLocaleString()} ${currency}`;
    }
    
    return null;
  }
}

export const vacancyService = new VacancyService(); 