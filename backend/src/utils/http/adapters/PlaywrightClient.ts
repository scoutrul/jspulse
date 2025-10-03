import { chromium, Browser, BrowserContext, Page } from '@playwright/test';

export interface PlaywrightClientOptions {
  headless?: boolean;
  userAgent?: string;
  timeout?: number;
  retries?: number;
  logging?: boolean;
}

export interface JobListing {
  title: string;
  company: string;
  location: string;
  salary?: string;
  url: string;
  description?: string;
  publishedAt?: string;
}

export interface JobDetail {
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
}

/**
 * Playwright client for parsing SPA (Single Page Application) content
 * Handles JavaScript-rendered pages that traditional HTTP clients cannot access
 */
export class PlaywrightClient {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private options: Required<PlaywrightClientOptions>;

  constructor(options: PlaywrightClientOptions = {}) {
    this.options = {
      headless: options.headless ?? true,
      userAgent: options.userAgent ?? 'JS-Pulse/1.0 (jspulse.ru)',
      timeout: options.timeout ?? 30000,
      retries: options.retries ?? 3,
      logging: options.logging ?? false,
    };
  }

  /**
   * Ensures browser is launched and context is created
   */
  private async ensureBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.options.headless,
        executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1179/chrome-linux/headless_shell',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      this.context = await this.browser.newContext({
        userAgent: this.options.userAgent,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
      });

      if (this.options.logging) {
        console.log('✅ Playwright browser launched');
      }
    }
  }

  /**
   * Gets job listings from careered.io with pagination support
   */
  async getJobListings(page: number = 1): Promise<string[]> {
    await this.ensureBrowser();

    const pageInstance = await this.context!.newPage();

    try {
      const url = page === 1
        ? 'https://careered.io/?tags=a7f11f28-d502-4b8f-8432-5a1862cc99fa'
        : `https://careered.io/?tags=a7f11f28-d502-4b8f-8432-5a1862cc99fa&page=${page}`;

      if (this.options.logging) {
        console.log(`🌐 Loading page: ${url}`);
      }

      await pageInstance.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Wait for job cards to load with multiple fallback selectors
      const jobCardSelectors = [
        '.overflow-hidden.rounded-lg.border.bg-white',
        '.job-card',
        '.vacancy-card',
        '[data-test*="job"]',
        '.job',
        '.vacancy',
        'main > div > div > div'
      ];

      let jobCardsFound = false;
      for (const selector of jobCardSelectors) {
        try {
          await pageInstance.waitForSelector(selector, { timeout: 5000 });
          jobCardsFound = true;
          if (this.options.logging) {
            console.log(`✅ Found job cards with selector: ${selector}`);
          }
          break;
        } catch (error) {
          // Try next selector
          continue;
        }
      }

      if (!jobCardsFound) {
        // Try to find job links directly
        const jobLinks = await pageInstance.$$eval('a[href*="/jobs/"]', (links: any[]) =>
          links.map((link: any) => link.href)
        );

        if (jobLinks.length > 0) {
          if (this.options.logging) {
            console.log(`✅ Found ${jobLinks.length} job links directly`);
          }
          return jobLinks;
        }

        throw new Error('No job cards or links found on page');
      }

      // Extract job information from cards - careered.io uses clickable divs, not links
      let jobData: Array<{ title: string, url: string }> = [];

      // Extract job data from the cards themselves
      try {
        jobData = await pageInstance.$$eval('.overflow-hidden.rounded-lg.border.bg-white', (cards: any[]) =>
          cards.map((card: any) => {
            const titleElement = card.querySelector('span[title]');
            const title = titleElement ? titleElement.getAttribute('title') :
              card.querySelector('span')?.textContent?.trim() || 'Unknown Job';

            // Try to find a data attribute or other identifier for the job ID
            const jobId = card.getAttribute('data-job-id') ||
              card.getAttribute('data-id') ||
              title.toLowerCase().replace(/[^a-z0-9]/g, '-');

            // Construct a URL - we'll need to figure out the actual pattern
            const url = `https://careered.io/jobs/${jobId}`;

            return { title, url };
          })
        );
      } catch (error) {
        console.log('Error extracting job data from cards:', error);
      }

      // Convert to job links
      const jobLinks = jobData.map(job => job.url);

      if (this.options.logging) {
        console.log(`✅ Extracted ${jobLinks.length} job links from page ${page}`);
        console.log(`🔍 Job data:`, jobData);

        // Debug: show job card structure
        const jobCardInfo = await pageInstance.evaluate(() => {
          const cards = (globalThis as any).document.querySelectorAll('.overflow-hidden.rounded-lg.border.bg-white');
          return Array.from(cards).slice(0, 3).map((card: any) => ({
            html: card.outerHTML.substring(0, 500),
            links: Array.from(card.querySelectorAll('a')).map((a: any) => ({ href: a.href, text: a.textContent?.trim() }))
          }));
        });
        console.log(`🔍 Job card structure:`, jobCardInfo);

        // Debug: show all links on the page
        if (jobLinks.length === 0) {
          const allLinks = await pageInstance.$$eval('a', (links: any[]) =>
            links.map((link: any) => ({ href: link.href, text: link.textContent?.trim() }))
          );
          console.log(`🔍 All links on page (${allLinks.length}):`, allLinks.slice(0, 10));

          // Debug: show page content structure
          const pageInfo = await pageInstance.evaluate(() => {
            return {
              title: (globalThis as any).document.title,
              bodyText: (globalThis as any).document.body.textContent?.substring(0, 500),
              allElements: (globalThis as any).document.querySelectorAll('*').length,
              jobElements: (globalThis as any).document.querySelectorAll('[class*="job"], [class*="vacancy"], [data-test*="job"]').length
            };
          });
          console.log('🔍 Page info:', pageInfo);
        }
      }

      return jobLinks;

    } catch (error) {
      if (this.options.logging) {
        console.error(`❌ Error getting job listings for page ${page}:`, error);
      }
      throw error;
    } finally {
      await pageInstance.close();
    }
  }

  /**
   * Fallback for SPA-only detail rendering: open list page, click the matching card, extract detail
   */
  async getJobDetailsFromCards(page: number): Promise<Array<{
    title: string;
    company: string;
    location: string;
    salary: string;
    description: string;
    url: string;
  }>> {
    await this.ensureBrowser();

    const pageInstance = await this.context!.newPage();

    try {
      // Prepare helpers to match card by slug or title
      const url = 'https://careered.io/?tags=a7f11f28-d502-4b8f-8432-5a1862cc99fa&page=' + page;
      if (this.options.logging) {
        console.log(`🌐 Loading page: ${url}`);
      }
      await pageInstance.goto(url, { waitUntil: 'networkidle', timeout: this.options.timeout });

      // Ensure cards are present
      await pageInstance.waitForSelector('.overflow-hidden.rounded-lg.border.bg-white', { timeout: 10000 });

      // Extract minimal data from cards
      const jobs = await pageInstance.$$eval('.overflow-hidden.rounded-lg.border.bg-white', (cards: any[]) => {
        function makeSlug(title: string): string {
          return title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        }
        return cards.map((card: any) => {
          const titleEl = card.querySelector('span[title]') || card.querySelector('span');
          const title = (titleEl?.getAttribute('title') || titleEl?.textContent || '').trim();
          const url = title ? `https://careered.io/jobs/${makeSlug(title)}` : '';
          return { title, company: '', location: '', salary: '', description: '', url };
        });
      });

      return jobs;
    } catch (error) {
      if (this.options.logging) {
        console.error(`❌ Error getting job details from cards:`, error);
      }
      throw error;
    } finally {
      await pageInstance.close();
    }
  }

  /**
   * Gets detailed information about a specific job
   */
  async getJobDetail(jobUrl: string): Promise<JobDetail | null> {
    await this.ensureBrowser();

    const pageInstance = await this.context!.newPage();

    try {
      if (this.options.logging) {
        console.log(`🔍 Loading job detail: ${jobUrl}`);
      }

      await pageInstance.goto(jobUrl, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Wait for content to load
      await pageInstance.waitForSelector('h1, .job-title, [data-test*="title"]', {
        timeout: 10000
      });

      // Extract job details
      const jobDetail = await pageInstance.evaluate(() => {
        const getText = (selector: string): string => {
          const element = (globalThis as any).document.querySelector(selector);
          return element ? element.textContent?.trim() || '' : '';
        };

        const getHtml = (selector: string): string => {
          const element = (globalThis as any).document.querySelector(selector);
          return element ? element.innerHTML || '' : '';
        };

        // Try multiple selectors for each field
        const title = getText('h1, .job-title, [data-test*="title"]') || 'Без названия';
        const company = getText('.company, [data-test*="company"]') || 'Неизвестная компания';

        // Location - try multiple approaches
        let location = getText('.location, [data-test*="location"]');
        if (!location) {
          // Look for location in other elements
          const locationElements = (globalThis as any).document.querySelectorAll('*');
          for (const el of locationElements) {
            const text = el.textContent || '';
            if (text.includes('Remote') || text.includes('Удаленно') || text.includes('удаленн')) {
              location = 'Remote';
              break;
            }
          }
        }
        if (!location) location = 'Неизвестное местоположение';

        // Description - try multiple selectors
        const descriptionSelectors = [
          '.job-description',
          '.description',
          '.content',
          'main p',
          '[data-test*="description"]'
        ];

        let description = '';
        for (const selector of descriptionSelectors) {
          description = getText(selector);
          if (description && description.length > 50) break;
        }

        // Full description (HTML)
        const fullDescriptionSelectors = [
          '.job-description',
          '.description',
          '.content',
          'main'
        ];

        let fullDescription = '';
        for (const selector of fullDescriptionSelectors) {
          fullDescription = getHtml(selector);
          if (fullDescription && fullDescription.length > 100) break;
        }

        // Salary parsing
        let salary = '';
        const salaryElements = (globalThis as any).document.querySelectorAll('*');
        for (const el of salaryElements) {
          const text = el.textContent || '';
          if (text.includes('$') || text.includes('₽') || text.includes('€') || text.includes('руб')) {
            salary = text;
            break;
          }
        }

        // Parse salary if found
        let parsedSalary: { from?: number; to?: number; currency?: string } | undefined;
        if (salary) {
          // Simple salary parsing - can be enhanced
          const salaryMatch = salary.match(/(\d{1,3}(?:,\d{3})*)\s*—\s*(\d{1,3}(?:,\d{3})*)\s*([$₽€])/i);
          if (salaryMatch) {
            parsedSalary = {
              from: parseInt(salaryMatch[1].replace(/,/g, "")),
              to: parseInt(salaryMatch[2].replace(/,/g, "")),
              currency: salaryMatch[3] === '$' ? 'USD' : salaryMatch[3] === '₽' ? 'RUB' : 'EUR'
            };
          }
        }

        return {
          title,
          company,
          location,
          description,
          fullDescription,
          salary: parsedSalary,
          isRemote: /удаленн|remote/i.test(description) || /удаленн|remote/i.test(location),
          publishedAt: new Date().toISOString()
        };
      });

      if (this.options.logging) {
        console.log(`✅ Extracted job detail: ${jobDetail.title}`);
      }

      return jobDetail;

    } catch (error) {
      if (this.options.logging) {
        console.error(`❌ Error getting job detail for ${jobUrl}:`, error);
      }
      return null;
    } finally {
      await pageInstance.close();
    }
  }

  /**
   * Renders a page and returns the HTML content
   */
  async renderPage(url: string): Promise<string> {
    await this.ensureBrowser();

    const pageInstance = await this.context!.newPage();

    try {
      if (this.options.logging) {
        console.log(`🖼️ Rendering page: ${url}`);
      }

      await pageInstance.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Wait a bit more for any dynamic content
      await pageInstance.waitForTimeout(2000);

      const html = await pageInstance.content();

      if (this.options.logging) {
        console.log(`✅ Rendered page: ${html.length} characters`);
      }

      return html;

    } catch (error) {
      if (this.options.logging) {
        console.error(`❌ Error rendering page ${url}:`, error);
      }
      throw error;
    } finally {
      await pageInstance.close();
    }
  }

  /**
   * Closes the browser and cleans up resources
   */
  async close(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      if (this.options.logging) {
        console.log('🔌 Playwright browser closed');
      }
    } catch (error) {
      if (this.options.logging) {
        console.error('❌ Error closing Playwright browser:', error);
      }
    }
  }

  /**
   * Checks if browser is currently running
   */
  isRunning(): boolean {
    return this.browser !== null && this.context !== null;
  }
}
