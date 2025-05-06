import type {
  VacancyDTO,
  HHVacancyRaw,
  HHSalary,
  PaginatedVacanciesResponse,
  HHResponseRaw,
} from "@jspulse/shared";
import { apiClient } from "$lib/api/http.client.js";
import { API_CONFIG } from "../config/api.config.js";
import { createHttpClient } from "$lib/utils/http/index.js";

// HTTP клиент для запросов к HeadHunter API
const hhClient = createHttpClient({
  baseUrl: API_CONFIG.HH_API.BASE_URL,
  defaultHeaders: {
    "User-Agent": "JSPulse/1.0",
    "Content-Type": "application/json"
  }
});

type TransformedVacancy = Omit<VacancyDTO, "_id">;

interface FormattedSalary {
  salaryFrom: number | undefined;
  salaryTo: number | undefined;
  salaryCurrency: string | undefined;
}

// Типы для ответа API
interface ApiResponse {
  success: boolean;
  data: VacancyDTO[];
  meta?: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  error?: {
    code: number;
    message: string;
    details?: unknown;
  };
}

class VacancyService {
  async getVacancies(params: {
    page?: number;
    limit?: number;
    skills?: string[];
  }): Promise<PaginatedVacanciesResponse["data"]> {
    try {
      // Создаем параметры запроса как строки
      const searchParams = new URLSearchParams();

      // Страница и лимит должны быть нулевыми для первой страницы, не 1
      searchParams.set('page', String(params.page || 0));
      searchParams.set('limit', String(params.limit || 10));

      if (params.skills && params.skills.length > 0) {
        searchParams.set('skills', params.skills.join(","));
      }

      // Формируем URL с параметрами
      const url = `${API_CONFIG.ENDPOINTS.VACANCIES}?${searchParams.toString()}`;
      console.log(`[VacancyService] Запрос вакансий: ${url}`);

      // Выполняем запрос через API клиент и приводим к типу ответа
      const response = await apiClient.get(url) as unknown as ApiResponse;

      // Проверяем и обрабатываем ответ
      if (!response || !response.success || !response.data) {
        console.error("Ошибка при получении вакансий:", response);
        return { items: [], total: 0, page: 0, limit: 0, totalPages: 0 };
      }

      // Преобразуем даты
      const vacanciesWithDates = response.data.map((vacancy: VacancyDTO) => ({
        ...vacancy,
        publishedAt: new Date(vacancy.publishedAt),
      }));

      // Формируем ответ с пагинацией
      return {
        items: vacanciesWithDates,
        total: response.meta?.totalItems || 0,
        page: response.meta?.page || 0,
        limit: response.meta?.limit || 10,
        totalPages: response.meta?.totalPages || 0
      };
    } catch (error) {
      console.error("Ошибка при получении вакансий:", error);
      // В случае ошибки возвращаем пустой результат
      return { items: [], total: 0, page: 0, limit: 0, totalPages: 0 };
    }
  }

  async getHHVacancies(params: {
    text?: string;
    area?: string;
    page?: number;
    per_page?: number;
  }): Promise<TransformedVacancy[]> {
    try {
      // Преобразуем числовые параметры в строки для соответствия типу Record<string, string>
      const stringParams: Record<string, string> = {};

      if (params.text) stringParams.text = params.text;
      if (params.area) stringParams.area = params.area;
      if (params.page !== undefined) stringParams.page = String(params.page);
      if (params.per_page !== undefined) stringParams.per_page = String(params.per_page);

      const response = await hhClient.get(API_CONFIG.HH_API.VACANCIES_ENDPOINT, { params: stringParams });
      const hhResponse = response as HHResponseRaw;

      if (hhResponse && Array.isArray(hhResponse.items)) {
        return hhResponse.items.map((hhVacancy: HHVacancyRaw) => this.transformHHVacancy(hhVacancy));
      } else {
        console.error("Unexpected response structure from HH API:", hhResponse);
        return [];
      }
    } catch (error) {
      console.error("Error fetching vacancies from HH API:", error);
      return [];
    }
  }

  transformHHVacancy(hhVacancy: HHVacancyRaw): TransformedVacancy {
    const salaryInfo = this.parseSalary(hhVacancy.salary);

    let description = hhVacancy.description || "";
    if (!description) {
      description = [hhVacancy.snippet?.requirement, hhVacancy.snippet?.responsibility]
        .filter(Boolean)
        .join("\n");
    }

    return {
      externalId: hhVacancy.id,
      title: hhVacancy.name,
      company: hhVacancy.employer?.name ?? "Не указана",
      location: hhVacancy.area?.name ?? "Не указано",
      url: hhVacancy.alternate_url,
      publishedAt: new Date(hhVacancy.published_at),
      source: "hh.ru",
      description: description,
      schedule: hhVacancy.schedule?.name,
      skills: hhVacancy.key_skills?.map((skill: { name: string }) => skill.name) ?? [],
      salaryFrom: salaryInfo.salaryFrom,
      salaryTo: salaryInfo.salaryTo,
      salaryCurrency: salaryInfo.salaryCurrency,
      experience: hhVacancy.experience?.name,
      employment: hhVacancy.employment?.name,
      address: hhVacancy.address?.raw,
    };
  }

  private parseSalary(salary: HHSalary | null | undefined): FormattedSalary {
    const result: FormattedSalary = {
      salaryFrom: undefined,
      salaryTo: undefined,
      salaryCurrency: undefined,
    };

    if (!salary) {
      return result;
    }

    result.salaryFrom = salary.from ?? undefined;
    result.salaryTo = salary.to ?? undefined;
    result.salaryCurrency = salary.currency?.toUpperCase() ?? undefined;

    if (result.salaryCurrency && result.salaryFrom === undefined && result.salaryTo === undefined) {
      result.salaryCurrency = undefined;
    }

    return result;
  }
}

export const vacancyService = new VacancyService();
