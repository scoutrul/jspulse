import type { PaginatedVacanciesResponse, VacancyDTO } from "@jspulse/shared";
import { transformVacancies } from "$lib/utils/vacancyTransformations";
import { httpClient } from "$lib/utils/http";

export interface VacanciesOptions {
  limit?: number;
  page?: number;
  skills?: string[];
}

export interface VacanciesResponse {
  vacancies: (VacancyDTO & { htmlDescription?: string })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}

/**
 * Получение вакансий на клиенте
 */
export const fetchVacanciesClient = async (
  options: VacanciesOptions = {}
): Promise<VacanciesResponse> => {
  const { limit = 10, page = 0, skills = [] } = options;
  
  const params: Record<string, string> = {
    limit: String(limit),
    page: String(page),
  };
  
  if (skills.length > 0) {
    params.skills = skills.join(",");
  }

  try {
    const response = await httpClient.get<PaginatedVacanciesResponse>("api/vacancies", { 
      params 
    });

    if (response.status === "OK" && response.data) {
      const transformedVacancies = transformVacancies(response.data.items);
      
      return {
        vacancies: transformedVacancies,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
      };
    } else {
      console.error("Client-side API Error (Non-OK status or no data):", response);
      return {
        vacancies: [],
        total: 0,
        page: page,
        limit: limit,
        totalPages: 0,
        error: `Ошибка API: ${response.message || "Не удалось получить данные"}`,
      };
    }
  } catch (err) {
    console.error("Client-side API Error:", err);
    let errorMessage = "Произошла неизвестная ошибка при загрузке вакансий";
    
    if (err instanceof Error) {
      errorMessage = "Ошибка загрузки вакансий: " + err.message;
    }
    
    return {
      vacancies: [],
      total: 0,
      page: page,
      limit: limit,
      totalPages: 0,
      error: errorMessage,
    };
  }
}; 