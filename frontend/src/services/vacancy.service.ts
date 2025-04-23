import { apiClient, hhClient } from "../api/http.client";
import { API_CONFIG } from "../config/api.config";
import type {
  VacancyDTO,
  HHVacancyRaw,
  HHSalary,
  VacanciesApiResponse,
  HHResponseRaw,
} from "@jspulse/shared";

// Тип для трансформированной вакансии без _id
type TransformedVacancy = Omit<VacancyDTO, "_id">;

interface FormattedSalary {
  salaryFrom: number | undefined;
  salaryTo: number | undefined;
  salaryCurrency: string | undefined;
}

class VacancyService {
  // Получение вакансий из нашего API
  async getVacancies(): Promise<VacancyDTO[]> {
    const response = await apiClient
      .get(API_CONFIG.ENDPOINTS.VACANCIES)
      .json<VacanciesApiResponse>();
    if (response.status === "OK") {
      return response.data;
    } else {
      console.error("Failed to fetch vacancies:", response);
      throw new Error(response.message || "Failed to fetch vacancies from API");
    }
  }

  // Получение вакансий по тегам
  async getVacanciesByTags(tags: string[]): Promise<VacancyDTO[]> {
    const response = await apiClient
      .get(`${API_CONFIG.ENDPOINTS.VACANCIES_FILTER}/tags`, {
        searchParams: { tags: tags.join(",") },
      })
      .json<VacanciesApiResponse>();
    if (response.status === "OK") {
      return response.data;
    } else {
      console.error("Failed to fetch vacancies by tags:", response);
      throw new Error(response.message || "Failed to fetch vacancies by tags from API");
    }
  }

  // Получение вакансий напрямую из HH API и трансформация в наш DTO
  async getHHVacancies(params: {
    text?: string;
    area?: string;
    page?: number;
    per_page?: number;
  }): Promise<TransformedVacancy[]> {
    const hhResponse = await hhClient
      .get(API_CONFIG.HH_API.VACANCIES_ENDPOINT, { searchParams: params })
      .json<HHResponseRaw>();

    if (hhResponse && Array.isArray(hhResponse.items)) {
      return hhResponse.items.map((hhVacancy: HHVacancyRaw) => this.transformHHVacancy(hhVacancy));
    } else {
      console.error("Unexpected response structure from HH API:", hhResponse);
      return [];
    }
  }

  // Преобразование сырой вакансии HH в наш формат VacancyDTO
  transformHHVacancy(hhVacancy: HHVacancyRaw): TransformedVacancy {
    const salaryInfo = this.parseSalary(hhVacancy.salary);

    let description = hhVacancy.description || hhVacancy.branded_description || "";
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
      skills: hhVacancy.key_skills?.map((skill) => skill.name) ?? [],
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
      console.warn("Salary currency present but no 'from' or 'to' value:", salary);
      result.salaryCurrency = undefined;
    }

    return result;
  }
}

export const vacancyService = new VacancyService();
