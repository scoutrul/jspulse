import { createHttpClient, HttpClient } from "../HttpClient.js";

export interface HabrListPageResult {
  html: string;
  url: string;
}

export interface HabrVacancyPageResult {
  html: string;
  url: string;
}

export class HabrClient {
  private httpClient: HttpClient;

  constructor(options: { userAgent?: string; logging?: boolean } = {}) {
    this.httpClient = createHttpClient({
      baseUrl: "https://career.habr.com/",
      logging: options.logging,
      defaultHeaders: {
        "User-Agent": options.userAgent || "JS-Pulse/1.0 (jspulse.ru)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru,en;q=0.8",
      },
      retry: 2,
      timeout: 20000,
    });
  }

  async getListPage(params: Record<string, string | number>): Promise<HabrListPageResult> {
    const url = "vacancies";
    const html = await this.httpClient.getText(url, { params: params as any });
    return { html, url: this.httpClient.resolveUrl(url, params) };
  }

  async getVacancyPage(pathOrUrl: string): Promise<HabrVacancyPageResult> {
    const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
    const url = isAbsolute ? pathOrUrl : pathOrUrl.replace(/^\/?/, "");
    const html = await this.httpClient.getText(url);
    return { html, url: isAbsolute ? url : this.httpClient.resolveUrl(url) };
  }
}
