import type { PaginatedVacanciesResponse, VacancyDTO } from "@jspulse/shared";
import { apiClient, HTTPError } from "$lib/api/http.client";
import { transformVacancies } from "$lib/utils/vacancyTransformations";

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
  
  const searchParams = {
    limit: String(limit),
    page: String(page),
    skills: skills.join(","),
  };

  try {
    const response = await apiClient
      .get("api/vacancies", { searchParams })
      .json<PaginatedVacanciesResponse>();

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
    
    if (err instanceof HTTPError) {
      errorMessage = `Ошибка сети или сервера: ${err.message}`;
      try {
        const errorBody = await err.response.json();
        if (errorBody?.message) errorMessage += ` (${errorBody.message})`;
      } catch {
        /* ignore */
      }
    } else if (err instanceof Error) {
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