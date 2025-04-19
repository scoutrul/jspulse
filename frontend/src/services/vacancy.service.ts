import type { VacanciesResponse } from '@jspulse/shared';

const API_URL = import.meta.env.VITE_BACKEND_URL;

class VacancyService {
  private baseUrl = `${API_URL}/api/vacancies`;

  async getVacancies(): Promise<VacanciesResponse> {
    const response = await fetch(this.baseUrl);
    return response.json();
  }

  async getVacanciesByTags(tags: string[]): Promise<VacanciesResponse> {
    const response = await fetch(`${this.baseUrl}/filter/tags?tags=${tags.join(',')}`);
    return response.json();
  }
}

export const vacancyService = new VacancyService(); 