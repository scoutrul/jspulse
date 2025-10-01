import mongoose from "../config/database.js";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { CareeredClient } from "../utils/http/adapters/CareeredClient.js";
import { containsBackendStopWords } from "../config/backendStopWords.js";
import { normalizeSkill } from "../utils/transformations.js";

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

  try {
    connection = await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB подключен");

    const Vacancy = await getVacancyModel();

    // Initialize CareeredClient with logging enabled
    careeredClient = new CareeredClient({
      logging: true,
      mode: 'playwright' // Force Playwright mode for testing
    });

    let totalReceived = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    const collectedLinks: string[] = [];

    // Собираем ссылки на вакансии со всех страниц
    for (let page = 1; page <= MAX_PAGES; page++) {
      console.log(`📄 Страница списка ${page}/${MAX_PAGES}`);

      try {
        const listResult = await careeredClient.getListPage({ page });

        console.log(`📄 HTML длина: ${listResult.html.length}`);
        console.log(`🔗 Найдено ссылок: ${listResult.jobLinks.length}`);

        if (listResult.jobLinks.length === 0 && page > 1) {
          console.log("🏁 Похоже, вакансии закончились. Останавливаюсь.");
          break;
        }

        collectedLinks.push(...listResult.jobLinks);
        console.log(`🔗 Всего собрано ссылок: ${collectedLinks.length} (страница ${page})`);

        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`Ошибка загрузки страницы ${page}:`, error);
        break;
      }
    }

    const uniqueLinks = Array.from(new Set(collectedLinks));
    console.log(`📊 Всего уникальных вакансий: ${uniqueLinks.length}`);
    console.log(`🔗 Собранные ссылки:`, collectedLinks);
    console.log(`🔗 Уникальные ссылки:`, uniqueLinks);

    // Парсим каждую вакансию
    for (const jobUrl of uniqueLinks) {
      try {
        const jobResult = await careeredClient.getVacancyPage(jobUrl);

        if (!jobResult.jobDetail) {
          totalSkipped++;
          console.log(`  ⚠️ Не удалось извлечь детали: ${jobUrl}`);
          continue;
        }

        const { title, company, location, description, fullDescription, salary, isRemote, publishedAt } = jobResult.jobDetail;

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

        // Добавляем информацию о зарплате если есть
        if (salary) {
          transformed.salaryFrom = salary.from;
          transformed.salaryTo = salary.to;
          transformed.salaryCurrency = salary.currency;
        }

        // Фильтрация по стоп-словам бэкенда
        if (containsBackendStopWords((title + " " + preview).toLowerCase())) {
          totalSkipped++;
          console.log(`  🚫 ПРОПУЩЕНА (стоп-слова): "${title}"`);
          continue;
        }

        const existing = await Vacancy.findOne({ sourceUrl: jobUrl });
        if (!existing) {
          await Vacancy.create(transformed);
          totalNew++;
          console.log(`  ✨ НОВАЯ: "${title}" (${jobUrl})`);
        } else {
          const res = await Vacancy.updateOne({ _id: existing._id }, { ...transformed, updatedAt: new Date() });
          if (res.modifiedCount > 0) {
            totalUpdated++;
            console.log(`  🔄 ОБНОВЛЕНА: "${title}" (${jobUrl})`);
          } else {
            console.log(`  ⚪ БЕЗ ИЗМЕНЕНИЙ: "${title}" (${jobUrl})`);
          }
        }

        totalReceived++;
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        totalSkipped++;
        console.error("❌ Ошибка парсинга вакансии:", jobUrl, err);
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
    if (careeredClient) {
      await careeredClient.close();
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Соединение с MongoDB закрыто");
    }
  }
}

fetchAndSaveFromCareered();
