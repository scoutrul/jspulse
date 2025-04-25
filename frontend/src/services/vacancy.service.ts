import type {
  VacancyDTO,
  HHVacancyRaw,
  HHSalary,
  PaginatedVacanciesResponse,
  HHResponseRaw,
} from "@jspulse/shared";
// import ky from "ky"; // Удаляем неиспользуемый импорт
import { apiClient, hhClient } from "../api/http.client";
import { API_CONFIG } from "../config/api.config";

// Тип для трансформированной вакансии без _id
type TransformedVacancy = Omit<VacancyDTO, "_id">;

interface FormattedSalary {
  salaryFrom: number | undefined;
  salaryTo: number | undefined;
  salaryCurrency: string | undefined;
}

class VacancyService {
  // Получение вакансий из нашего API с пагинацией и фильтрацией
  async getVacancies(params: {
    page?: number;
    limit?: number;
    skills?: string[];
  }): Promise<PaginatedVacanciesResponse["data"]> {
    const searchParams: Record<string, string | number> = {
      page: params.page || 1,
      limit: params.limit || 10,
    };

    if (params.skills && params.skills.length > 0) {
      searchParams.skills = params.skills.join(",");
    }

    const response = await apiClient
      .get(API_CONFIG.ENDPOINTS.VACANCIES, { searchParams })
      .json<PaginatedVacanciesResponse>();

    if (response.status === "OK") {
      // Преобразуем строки дат в объекты Date
      const vacanciesWithDates = response.data.vacancies.map((vacancy: VacancyDTO) => ({
        ...vacancy,
        // Преобразуем строку в Date. Полагаемся, что publishedAt всегда строка.
        publishedAt: new Date(vacancy.publishedAt),
      }));

      // Возвращаем данные с преобразованными датами
      return {
        ...response.data,
        vacancies: vacanciesWithDates,
      };
    } else {
      console.error("Failed to fetch vacancies:", response);
      throw new Error(response.message || "Failed to fetch vacancies from API");
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
