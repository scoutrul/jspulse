import { HttpClient, HttpRequestOptions } from "../HttpClient.js";
import { KyHttpClient } from "../KyHttpClient.js";
import { LoggingHttpClient } from "../LoggingHttpClient.js";

// Интерфейсы для типов данных HeadHunter API
export interface HHVacancy {
  id: string;
  name: string;
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
    gross?: boolean;
  };
  employer: {
    id: string;
    name: string;
    trusted: boolean;
    url: string;
    alternate_url: string;
    logo_urls?: Record<string, string>;
  };
  published_at: string;
  alternate_url: string;
  snippet: {
    requirement?: string;
    responsibility?: string;
  };
  // И другие поля из API
}

export interface HHSearchParams {
  text?: string;
  area?: number | number[];
  per_page?: number;
  page?: number;
  experience?: string;
  schedule?: string;
  employment?: string;
  only_with_salary?: boolean;
}

export interface HHSearchResponse {
  items: HHVacancy[];
  found: number;
  pages: number;
  per_page: number;
  page: number;
}

/**
 * Адаптер для работы с API HeadHunter
 * Инкапсулирует специфику API и предоставляет удобные методы
 */
export class HeadHunterClient {
  private httpClient: HttpClient;

  constructor(options: {
    userAgent?: string;
    logging?: boolean;
  } = {}) {
    // Создаем базовый HTTP-клиент
    let client: HttpClient = new KyHttpClient("https://api.hh.ru/", {
      headers: {
        "User-Agent": options.userAgent || "JS-Pulse/1.0 (https://jspulse.ru)",
        "Accept": "application/json"
      },
      retry: 2,
      timeout: 15000
    });

    // Если нужно логирование, оборачиваем в декоратор
    if (options.logging) {
      client = new LoggingHttpClient(client);
    }

    this.httpClient = client;
  }

  /**
   * Поиск вакансий в HeadHunter
   * @param params Параметры поиска
   */
  async searchVacancies(params: HHSearchParams): Promise<HHSearchResponse> {
    return this.httpClient.get<HHSearchResponse>("vacancies", {
      params: this.prepareSearchParams(params)
    });
  }

  /**
   * Получение подробной информации о вакансии
   * @param id Идентификатор вакансии
   */
  async getVacancy(id: string): Promise<HHVacancy> {
    return this.httpClient.get<HHVacancy>(`vacancies/${id}`);
  }

  /**
   * Преобразует параметры поиска в формат, принимаемый API HeadHunter
   */
  private prepareSearchParams(params: HHSearchParams): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        result[key] = value.join(",");
      } else if (typeof value === "boolean") {
        result[key] = value ? "true" : "false";
      } else {
        result[key] = String(value);
      }
    }

    return result;
  }
} 