import { createHttpClient, HttpClient } from "../HttpClient.js";
import { PlaywrightClient, PlaywrightClientOptions } from "./PlaywrightClient.js";

export interface CareeredListPageResult {
  html: string;
  url: string;
  jobLinks: string[];
}

export interface CareeredVacancyPageResult {
  html: string;
  url: string;
  jobDetail?: {
    title: string;
    company: string;
    location: string;
    description: string;
    fullDescription?: string;
    salary?: {
      from?: number;
      to?: number;
      currency?: string;
    };
    skills?: string[];
    isRemote?: boolean;
    publishedAt?: string;
  };
}

export interface CareeredApiJob {
  id: string;
  kind: string;
  tag: {
    id: string;
    name: string;
  };
  content: string;
  features: Array<{
    key: string;
    value: string;
  }>;
  links: Array<{
    key: string;
    value: string;
  }>;
  mode: string;
  posted_at: number;
}

export interface CareeredApiResponse {
  entries: CareeredApiJob[];
  recommended_entry: any;
  offset: number;
  limit: number;
  total: number;
}

export interface CareeredClientOptions {
  userAgent?: string;
  logging?: boolean;
  mode?: 'api' | 'playwright' | 'auto';
  playwright?: PlaywrightClientOptions;
}

/**
 * Hybrid client for careered.io that combines HTTP and Playwright approaches
 * Tries API first, falls back to Playwright for SPA rendering
 */
export class CareeredClient {
  private httpClient: HttpClient;
  private playwrightClient: PlaywrightClient;
  private mode: 'api' | 'playwright' | 'auto';
  private options: CareeredClientOptions;

  constructor(options: CareeredClientOptions = {}) {
    this.options = options;
    this.mode = (options.mode || (process.env.CAREERED_MODE as any) || 'auto');

    // Initialize HTTP client
    this.httpClient = createHttpClient({
      baseUrl: "https://careered.io/",
      logging: options.logging,
      defaultHeaders: {
        "User-Agent": options.userAgent || "JS-Pulse/1.0 (jspulse.ru)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru,en;q=0.8",
      },
      retry: 2,
      timeout: 20000,
    });

    // Initialize Playwright client
    this.playwrightClient = new PlaywrightClient({
      ...options.playwright,
      userAgent: options.userAgent || "JS-Pulse/1.0 (jspulse.ru)",
      logging: options.logging,
    });
  }

  /**
   * Gets job listings from careered.io with pagination support
   */
  async getListPage(params: Record<string, string | number>): Promise<CareeredListPageResult> {
    const page = Number(params.page) || 1;
    const url = this.httpClient.resolveUrl('', {
      tags: 'a7f11f28-d502-4b8f-8432-5a1862cc99fa',
      page: String(page)
    });
    if (this.playwrightClient && (this as any).httpClient && (this as any).httpClient.options?.logging) {
      console.log(`[CareeredClient] mode=${this.mode} url=${url}`);
    } else {
      console.log(`[CareeredClient] mode=${this.mode} url=${url}`);
    }

    if (this.mode === 'playwright') {
      return this.getListPageWithPlaywright(page);
    }

    if (this.mode === 'api') {
      return this.getListPageWithAPI(url);
    }

    // Auto mode: try API first, fallback to Playwright
    try {
      return await this.getListPageWithAPI(url);
    } catch (error) {
      console.warn('API failed, falling back to Playwright:', error);
      return this.getListPageWithPlaywright(page);
    }
  }

  /**
   * Gets detailed information about a specific job
   */
  async getVacancyPage(pathOrUrl: string): Promise<CareeredVacancyPageResult> {
    const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
    const url = isAbsolute ? pathOrUrl : `https://careered.io${pathOrUrl.startsWith('/') ? pathOrUrl : '/' + pathOrUrl}`;

    if (this.mode === 'playwright') {
      return this.getVacancyPageWithPlaywright(url);
    }

    if (this.mode === 'api') {
      return this.getVacancyPageWithAPI(url);
    }

    // Auto mode: try API first, fallback to Playwright
    try {
      return await this.getVacancyPageWithAPI(url);
    } catch (error) {
      console.warn('API failed, falling back to Playwright:', error);
      return this.getVacancyPageWithPlaywright(url);
    }
  }

  /**
   * Gets job listings using HTTP client (for potential API endpoints)
   */
  private async getListPageWithAPI(url: string): Promise<CareeredListPageResult> {
    const html = await this.httpClient.getText(url);

    // Try to extract job links from HTML (in case it's not a pure SPA)
    const jobLinks = await this.extractJobLinksFromHTML(html);

    // If no links found, throw to allow fallback in auto mode
    if (jobLinks.length === 0) {
      throw new Error('No job links found via API HTML parsing');
    }

    return {
      html,
      url,
      jobLinks
    };
  }

  /**
   * Gets job listings using Playwright (for SPA rendering)
   */
  private async getListPageWithPlaywright(page: number): Promise<CareeredListPageResult> {
    const jobLinks = await this.playwrightClient.getJobListings(page);
    const url = this.httpClient.resolveUrl('', {
      tags: 'a7f11f28-d502-4b8f-8432-5a1862cc99fa',
      page: String(page)
    });

    // Get the rendered HTML for consistency
    const html = await this.playwrightClient.renderPage(url);

    return {
      html,
      url,
      jobLinks
    };
  }

  /**
   * Gets job details using HTTP client
   */
  private async getVacancyPageWithAPI(url: string): Promise<CareeredVacancyPageResult> {
    const html = await this.httpClient.getText(url);

    return {
      html,
      url,
      jobDetail: await this.parseJobDetailFromHTML(html, url)
    };
  }

  /**
   * Gets job details using Playwright
   */
  private async getVacancyPageWithPlaywright(url: string): Promise<CareeredVacancyPageResult> {
    const jobDetail = await this.playwrightClient.getJobDetail(url);
    const html = await this.playwrightClient.renderPage(url);

    return {
      html,
      url,
      jobDetail: jobDetail || undefined
    };
  }

  /**
   * Extracts job links from HTML content
   */
  private async extractJobLinksFromHTML(html: string): Promise<string[]> {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    const jobLinks: string[] = [];

    // Try multiple selectors for job links
    const linkSelectors = [
      'a[href*="/jobs/"]',
      '.job-card a',
      '.vacancy-card a',
      '[data-test*="job"] a'
    ];

    for (const selector of linkSelectors) {
      $(selector).each((_: any, el: any) => {
        const href = $(el).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `https://careered.io${href}`;
          jobLinks.push(fullUrl);
        }
      });
    }

    return [...new Set(jobLinks)]; // Remove duplicates
  }

  /**
   * Parses job details from HTML content
   */
  private async parseJobDetailFromHTML(html: string, url: string): Promise<CareeredVacancyPageResult['jobDetail']> {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    const getText = (selectors: string[]): string => {
      for (const selector of selectors) {
        const text = $(selector).first().text().trim();
        if (text) return text;
      }
      return '';
    };

    const title = getText(['h1', '.job-title', '[data-test*="title"]']) || 'Без названия';
    const company = getText(['.company', '[data-test*="company"]']) || 'Неизвестная компания';
    const location = getText(['.location', '[data-test*="location"]']) || 'Неизвестное местоположение';

    // Description
    const descriptionSelectors = [
      '.job-description',
      '.description',
      '.content',
      'main p',
      '[data-test*="description"]'
    ];

    let description = '';
    for (const selector of descriptionSelectors) {
      description = $(selector).first().text().trim();
      if (description && description.length > 50) break;
    }

    // Full description (HTML)
    let fullDescription = '';
    for (const selector of descriptionSelectors) {
      fullDescription = $(selector).first().html() || '';
      if (fullDescription && fullDescription.length > 100) break;
    }

    // Salary parsing
    let salary = '';
    $('*').each((_: any, el: any) => {
      const text = $(el).text();
      if (text && (text.includes('$') || text.includes('₽') || text.includes('€') || text.includes('руб'))) {
        salary = text;
        return false; // Break
      }
    });

    return {
      title,
      company,
      location,
      description,
      fullDescription: fullDescription || undefined,
      salary: salary ? this.parseSalary(salary) : undefined,
      isRemote: /удаленн|remote/i.test(description) || /удаленн|remote/i.test(location),
      publishedAt: new Date().toISOString()
    };
  }

  /**
   * Parses salary information from text
   */
  private parseSalary(salaryText: string): { from?: number; to?: number; currency?: string } {
    if (!salaryText || salaryText === "—") return {};

    // Patterns for different currencies
    const patterns = [
      // USD: "3,000 — 4,000 $/month"
      { regex: /(\d{1,3}(?:,\d{3})*)\s*—\s*(\d{1,3}(?:,\d{3})*)\s*\$/i, currency: "USD" },
      // RUB: "260,000 — 300,000 ₽/month"
      { regex: /(\d{1,3}(?:,\d{3})*)\s*—\s*(\d{1,3}(?:,\d{3})*)\s*₽/i, currency: "RUB" },
      // Hourly: "40 — 80 $/hour"
      { regex: /(\d+)\s*—\s*(\d+)\s*\$\/hour/i, currency: "USD" },
    ];

    for (const pattern of patterns) {
      const match = salaryText.match(pattern.regex);
      if (match) {
        const from = parseInt(match[1].replace(/,/g, ""));
        const to = parseInt(match[2].replace(/,/g, ""));
        return { from, to, currency: pattern.currency };
      }
    }

    return {};
  }

  /**
   * Closes the Playwright client and cleans up resources
   */
  async close(): Promise<void> {
    await this.playwrightClient.close();
  }

  /**
   * Gets the current parsing mode
   */
  getMode(): string {
    return this.mode;
  }

  /**
   * Sets the parsing mode
   */
  setMode(mode: 'api' | 'playwright' | 'auto'): void {
    this.mode = mode;
  }

  /**
   * Gets job listings from Careered API using Playwright
   */
  async getJobListingsFromAPI(offset: number = 0, limit: number = 20): Promise<CareeredApiResponse> {
    const url = `https://careered.io/jobs?tags=a7f11f28-d502-4b8f-8432-5a1862cc99fa&offset=${offset}`;

    if (this.options.logging) {
      console.log(`[CareeredClient] API request via Playwright: ${url}`);
    }

    try {
      // Use Playwright to get the page and intercept API calls
      const page = await this.playwrightClient.createPage();

      try {
        // Intercept network requests to find API calls
        const apiResponses: CareeredApiResponse[] = [];
        page.on('response', async (response: any) => {
          const responseUrl = response.url();
          if (responseUrl.includes('/jobs?') && response.status() === 200) {
            try {
              const json = await response.json();
              apiResponses.push(json);
            } catch (e) {
              // Not JSON
            }
          }
        });

        await page.goto(url, { waitUntil: 'networkidle' });

        // Wait for API response
        await page.waitForTimeout(3000);

        if (apiResponses.length === 0) {
          throw new Error('Could not intercept API response');
        }

        const data = apiResponses[0];

        if (this.options.logging) {
          console.log(`[CareeredClient] API response: ${data.entries.length} jobs, total: ${data.total}`);
        }

        return data;
      } finally {
        await page.close();
      }
    } catch (error) {
      if (this.options.logging) {
        console.error(`[CareeredClient] API request failed:`, error);
      }
      throw error;
    }
  }

  /**
   * Converts API job data to job detail format
   */
  private convertApiJobToJobDetail(apiJob: CareeredApiJob): CareeredVacancyPageResult['jobDetail'] {
    const features = apiJob.features.reduce((acc, feature) => {
      acc[feature.key] = feature.value;
      return acc;
    }, {} as Record<string, string>);

    const links = apiJob.links.reduce((acc, link) => {
      acc[link.key] = link.value;
      return acc;
    }, {} as Record<string, string>);

    const title = features.name || 'Без названия';
    const company = features.company || 'Неизвестная компания';
    const location = features.location || 'Remote';
    const description = features.summary || '';
    const fullDescription = features.summary || '';

    // Parse salary
    let salary: { from?: number; to?: number; currency?: string } | undefined;
    if (features.salary_from && features.salary_to && features.salary_currency) {
      salary = {
        from: parseInt(features.salary_from) || undefined,
        to: parseInt(features.salary_to) || undefined,
        currency: features.salary_currency
      };
    }

    // Parse published date
    const publishedAt = apiJob.posted_at ? new Date(apiJob.posted_at * 1000).toISOString() : new Date().toISOString();

    return {
      title,
      company,
      location,
      description,
      fullDescription,
      salary,
      isRemote: location.toLowerCase().includes('remote') || location.toLowerCase().includes('удаленн'),
      publishedAt
    };
  }

  /**
   * Gets job detail from API job data
   */
  async getJobDetailFromAPI(jobId: string): Promise<CareeredVacancyPageResult> {
    const url = `https://careered.io/jobs/${jobId}`;

    if (this.options.logging) {
      console.log(`[CareeredClient] Getting job detail for ID: ${jobId}`);
    }

    // For now, we'll need to get the job from the API list
    // In the future, there might be a direct job detail endpoint
    try {
      // Get job from API (we'll need to search through pages)
      let found = false;
      let offset = 0;
      let apiJob: CareeredApiJob | null = null;

      while (!found && offset < 1000) { // Limit search to prevent infinite loop
        const response = await this.getJobListingsFromAPI(offset, 20);

        apiJob = response.entries.find(job => job.id === jobId) || null;
        if (apiJob) {
          found = true;
          break;
        }

        if (response.entries.length === 0) {
          break; // No more jobs
        }

        offset += 20;
      }

      if (!apiJob) {
        throw new Error(`Job with ID ${jobId} not found`);
      }

      const jobDetail = this.convertApiJobToJobDetail(apiJob);
      const html = await this.httpClient.getText(url);

      return {
        html,
        url,
        jobDetail
      };
    } catch (error) {
      if (this.options.logging) {
        console.error(`[CareeredClient] Error getting job detail for ${jobId}:`, error);
      }
      throw error;
    }
  }

  /**
   * Gets full job description from the job page using Playwright
   */
  async getFullJobDescription(jobId: string): Promise<string> {
    const url = `https://careered.io/jobs/${jobId}`;

    if (this.options.logging) {
      console.log(`[CareeredClient] Getting full description for job: ${jobId}`);
    }

    try {
      const jobDetail = await this.playwrightClient.getJobDetail(url);

      if (!jobDetail) {
        throw new Error(`Could not extract job detail from ${url}`);
      }

      // Return the full description (HTML) or fallback to text description
      return jobDetail.fullDescription || jobDetail.description || '';
    } catch (error) {
      if (this.options.logging) {
        console.error(`[CareeredClient] Error getting full description for ${jobId}:`, error);
      }
      throw error;
    }
  }
}
