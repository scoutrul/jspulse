import mongoose from "../config/database.js";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { CareeredClient } from "../utils/http/adapters/CareeredClient.js";
import { PlaywrightClient } from "../utils/http/adapters/PlaywrightClient.js";
import { containsBackendStopWords } from "../config/backendStopWords.js";
import { normalizeSkill } from "../utils/transformations.js";
import { EarlyExitStrategy } from "../utils/parsing/earlyExitStrategy.js";

dotenv.config();

// Встроенная модель как в других скриптах
async function getVacancyModel() {
  const vacancySchema = new mongoose.Schema(
    {
      externalId: { type: String, unique: true, sparse: true },
      title: { type: String, required: true },
      company: { type: String, required: true },
      location: { type: String },
      url: { type: String, required: true },
      publishedAt: { type: Date, required: true },
      source: { type: String, required: true },
      description: { type: String },
      fullDescription: {
        type: {
          raw: { type: String },
          preview: { type: String },
          processed: { type: String },
          textOnly: { type: String },
        },
        default: undefined,
      },
      processedHtml: { type: String },
      schedule: { type: String },
      skills: [{ type: String }],
      salaryFrom: { type: Number },
      salaryTo: { type: Number },
      salaryCurrency: { type: String },
      experience: { type: String },
      employment: { type: String },
      address: { type: String },
      logoUrl: { type: String },
      isRemote: { type: Boolean },
      sourceId: { type: String, unique: true, sparse: true },
      sourceChannel: { type: String },
      sourceUrl: { type: String },
      contact: { type: String },
      workFormat: { type: String },
      hashtags: [{ type: String }],
      confidence: { type: Number },
      parsedAt: { type: Date },
      rawData: { type: mongoose.Schema.Types.Mixed },
    },
    {
      timestamps: true,
      versionKey: false,
      collection: "vacancies",
    }
  );

  vacancySchema.index({ publishedAt: -1 });

  return mongoose.model("Vacancy", vacancySchema);
}

const SOURCE = "careered";
const MAX_PAGES = 5;

function extractText($el: cheerio.Cheerio<any>): string {
  return $el.text().replace(/\s+/g, " ").trim();
}

function makeShort(text: string, limit = 500): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= limit) return trimmed;
  const slice = trimmed.slice(0, limit);
  const lastDot = Math.max(slice.lastIndexOf("."), slice.lastIndexOf("!"), slice.lastIndexOf("?"));
  return (lastDot > 100 ? slice.slice(0, lastDot + 1) : slice) + "…";
}

function parseSalary(salaryText: string): { from?: number; to?: number; currency?: string } {
  if (!salaryText || salaryText === "—") return {};

  // Паттерны для разных валют
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

function parseTimeAgo(timeText: string): Date {
  const now = new Date();
  const lower = timeText.toLowerCase();

  if (lower.includes("hour")) {
    const hours = parseInt(timeText.match(/(\d+)/)?.[1] || "1");
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  } else if (lower.includes("day")) {
    const days = parseInt(timeText.match(/(\d+)/)?.[1] || "1");
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  } else if (lower.includes("week")) {
    const weeks = parseInt(timeText.match(/(\d+)/)?.[1] || "1");
    return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  } else if (lower.includes("month")) {
    const months = parseInt(timeText.match(/(\d+)/)?.[1] || "1");
    return new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000);
  }

  return now;
}

function extractSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const possible = [
    "javascript", "typescript", "react", "next", "redux", "vue", "nuxt", "angular", "rxjs",
    "svelte", "webpack", "vite", "babel", "eslint", "jest", "vitest", "cypress", "playwright",
    "tailwind", "scss", "sass", "graphql", "apollo", "pwa", "webgl", "html", "css",
    "node.js", "nodejs", "express", "nestjs", "fastify", "mysql", "postgresql", "mongodb",
    "redis", "rabbitmq", "docker", "kubernetes", "aws", "azure", "gcp"
  ];
  return Array.from(new Set(possible.filter((k) => lower.includes(k)).map(normalizeSkill)));
}

// This function is now handled by CareeredClient

async function fetchAndSaveFromCareered() {
  console.log("🚀 Запускаю импорт с Careered.io…");
  const mongoUrl = process.env.MONGO_URI || "mongodb://mongodb:27017/jspulse";

  let connection;
  let careeredClient: CareeredClient | null = null;
  let playwrightClient: PlaywrightClient | null = null;

  try {
    connection = await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB подключен");

    const Vacancy = await getVacancyModel();

    // Initialize PlaywrightClient directly for HTML rendering
    playwrightClient = new PlaywrightClient({
      logging: true,
      headless: true
    });

    let totalReceived = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    // Собираем ссылки на вакансии со всех страниц
    for (let page = 1; page <= MAX_PAGES; page++) {
      console.log(`📄 Страница списка ${page}/${MAX_PAGES}`);

      try {
        console.log("Deriving links from rendered HTML...");
        const html = await playwrightClient!.renderPage(`https://careered.io/?tags=a7f11f28-d502-4b8f-8432-5a1862cc99fa&page=${page}`);
        const $ = cheerio.load(html);
        const extractedLinks: string[] = [];

        $('a[href*="/jobs/"]').each((_, el) => {
          const href = $(el).attr('href');
          if (href && href.includes('/jobs/')) {
            const fullUrl = href.startsWith('http') ? href : `https://careered.io${href}`;
            extractedLinks.push(fullUrl);
          }
        });

        // Fallback: build slugs from card titles if no anchors
        if (extractedLinks.length === 0) {
          $('.overflow-hidden.rounded-lg.border.bg-white span[title], .overflow-hidden.rounded-lg.border.bg-white span').each((_, el) => {
            const title = $(el).attr('title') || $(el).text();
            if (title && title.trim().length > 0) {
              const slug = title.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
              extractedLinks.push(`https://careered.io/jobs/${slug}`);
            }
          });
        }

        let jobLinks = Array.from(new Set(extractedLinks));
        console.log(`Found links: ${jobLinks.length}`);

        // Filter by stop-words using title-only heuristic (extract from URL slug)
        jobLinks = jobLinks.filter(url => {
          const part = (url.split('/jobs/')[1] || url).replace(/[-_]/g, ' ');
          const titleLower = decodeURIComponent(part).toLowerCase();
          return !containsBackendStopWords(titleLower);
        });
        console.log(`Links after stop-words filter: ${jobLinks.length}`);

        if (jobLinks.length === 0 && page > 1) {
          console.log("🏁 Похоже, вакансии закончились. Останавливаюсь.");
          break;
        }

        // Используем стратегию раннего выхода для обработки ссылок на странице
        const result = await EarlyExitStrategy.processPage(
          jobLinks,
          // Функция проверки существования вакансии
          async (jobUrl) => {
            const sourceIdMatch = jobUrl.match(/\/jobs\/([^\/?#]+)/i);
            const sourceId = sourceIdMatch ? sourceIdMatch[1] : jobUrl;
            const existing = await Vacancy.findOne({
              $or: [
                { sourceUrl: jobUrl },
                { externalId: `${SOURCE}:${sourceId}` }
              ]
            });
            return !!existing;
          },
          // Функция обработки новой вакансии
          async (jobUrl) => {
            await processVacancy(jobUrl);
          },
          {
            minNewItems: 1, // Минимум 1 новая вакансия для продолжения
            maxExistingRatio: 1.0, // Максимум 100% существующих вакансий
            verbose: true
          }
        );

        totalNew += result.newCount;
        totalUpdated += result.existingCount;
        totalSkipped += result.totalCount - result.newCount - result.existingCount;

        console.log(`📄 Страница ${page} итог: ✨${result.newCount} новых, 🔄${result.existingCount} обновлено, ❌${result.totalCount - result.newCount - result.existingCount} пропущено`);

        // Если все вакансии на странице уже существуют, прекращаем парсинг
        if (!result.shouldContinue) {
          console.log(`🛑 Остановка парсинга: ${result.stopReason}`);
          break;
        }

        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`Ошибка загрузки страницы ${page}:`, error);
        break;
      }
    }

    // Функция обработки отдельной вакансии
    async function processVacancy(jobUrl: string): Promise<void> {
      try {
        if (!playwrightClient) {
          throw new Error('PlaywrightClient не инициализирован');
        }
        const jobDetail = await playwrightClient.getJobDetail(jobUrl);

        if (!jobDetail) {
          console.log(`  ⚠️ Не удалось извлечь детали: ${jobUrl}`);
          throw new Error('Не удалось извлечь детали вакансии');
        }

        const { title, company, location, description, fullDescription, isRemote, publishedAt } = jobDetail;

        // Извлекаем ID из URL
        const sourceIdMatch = jobUrl.match(/\/jobs\/([^\/?#]+)/i);
        const sourceId = sourceIdMatch ? sourceIdMatch[1] : jobUrl;

        // Извлекаем навыки
        const skills = extractSkills(title + " " + description);

        // Создаем превью
        const preview = makeShort(description, 500);

        const transformed = {
          externalId: `${SOURCE}:${sourceId}`,
          title,
          company,
          location: location || "Remote",
          url: jobUrl,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          source: SOURCE,
          description: preview,
          fullDescription: fullDescription ? {
            raw: fullDescription,
            preview,
            processed: fullDescription,
            textOnly: description,
          } : undefined,
          skills: skills.length ? skills : ['javascript'],
          isRemote: isRemote || false,
          sourceId,
          sourceUrl: jobUrl,
          confidence: 0.9,
          parsedAt: new Date(),
        } as any;

        // Salary parsing is not implemented in PlaywrightClient yet

        // Фильтрация по стоп-словам бэкенда: проверяем ТОЛЬКО заголовок
        if (containsBackendStopWords(title.toLowerCase())) {
          console.log(`  🚫 ПРОПУЩЕНА (стоп-слова): "${title}"`);
          throw new Error('Вакансия содержит стоп-слова');
        }

        // Создаем новую вакансию
        await Vacancy.create(transformed);
        console.log(`  ✨ НОВАЯ: "${title}" (${jobUrl})`);
        totalReceived++;

        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error("❌ Ошибка парсинга вакансии:", jobUrl, err);
        throw err;
      }
    }

    console.log("\n🎯 ИТОГ Careered.io:");
    console.log(`📊 Получено: ${totalReceived}`);
    console.log(`✨ Новых: ${totalNew}`);
    console.log(`🔄 Обновлено: ${totalUpdated}`);
    console.log(`❌ Пропущено: ${totalSkipped}`);
  } catch (error) {
    console.error("❌ Ошибка импорта Careered.io:", error);
  } finally {
    // Clean up resources
    if (playwrightClient) {
      await playwrightClient.close();
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Соединение с MongoDB закрыто");
    }
  }
}

fetchAndSaveFromCareered();
