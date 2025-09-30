import mongoose from "../config/database.js";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import ky from "ky";
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
const BASE_URL = "https://careered.io";
const TAGS_PARAM = "a7f11f28-d502-4b8f-8432-5a1862cc99fa";
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

async function fetchJobDetail(jobUrl: string): Promise<{ title: string; company: string; description: string; fullDescription?: string } | null> {
  try {
    const html = await ky.get(jobUrl, {
      headers: { 'user-agent': 'Mozilla/5.0 JSPulse' },
      timeout: 30000
    }).text();

    const $ = cheerio.load(html);

    const title = extractText($("h1, .job-title, [data-test*='title']").first());
    const company = extractText($(".company, [data-test*='company']").first());

    // Ищем описание в разных местах
    let description = "";
    const descSelectors = [
      ".job-description",
      ".description",
      ".content",
      "main p",
      "[data-test*='description']"
    ];

    for (const selector of descSelectors) {
      const desc = extractText($(selector).first());
      if (desc && desc.length > 50) {
        description = desc;
        break;
      }
    }

    // Полное описание (HTML)
    const fullDescSelectors = [
      ".job-description",
      ".description",
      ".content",
      "main"
    ];

    let fullDescription = "";
    for (const selector of fullDescSelectors) {
      const html = $(selector).first().html();
      if (html && html.length > 100) {
        fullDescription = html;
        break;
      }
    }

    return {
      title: title || "Без названия",
      company: company || "Неизвестная компания",
      description,
      fullDescription
    };
  } catch (error) {
    console.error(`Ошибка загрузки деталей ${jobUrl}:`, error);
    return null;
  }
}

async function fetchAndSaveFromCareered() {
  console.log("🚀 Запускаю импорт с Careered.io…");
  const mongoUrl = process.env.MONGO_URI || "mongodb://mongodb:27017/jspulse";

  let connection;
  try {
    connection = await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB подключен");

    const Vacancy = await getVacancyModel();

    let totalReceived = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    const collectedLinks: string[] = [];

    // Собираем ссылки на вакансии со всех страниц
    for (let page = 1; page <= MAX_PAGES; page++) {
      // Попробуем разные варианты URL
      const listUrl = page === 1 ? `${BASE_URL}/?tags=${TAGS_PARAM}` : `${BASE_URL}/?tags=${TAGS_PARAM}&page=${page}`;
      console.log(`📄 Страница списка ${page}/${MAX_PAGES}: ${listUrl}`);

      try {
        const html = await ky.get(listUrl, {
          headers: { 'user-agent': 'Mozilla/5.0 JSPulse' },
          timeout: 30000
        }).text();

        const $ = cheerio.load(html);

        // Отладочная информация
        console.log(`📄 HTML длина: ${html.length}`);
        console.log(`📄 Заголовок страницы: ${$('title').text()}`);

        // Покажем первые 500 символов HTML для отладки
        console.log(`📄 HTML начало: ${html.substring(0, 500)}`);

        // Ищем карточки вакансий - пробуем разные селекторы
        const jobCards = $(".overflow-hidden.rounded-lg.border.bg-white, .job-card, .vacancy-card, [data-test*='job'], .job, .vacancy, main > div > div > div");

        console.log(`🔍 Найдено элементов: ${jobCards.length}`);

        if (jobCards.length === 0 && page > 1) {
          console.log("🏁 Похоже, вакансии закончились. Останавливаюсь.");
          break;
        }

        // Если не нашли карточки, попробуем найти ссылки напрямую
        if (jobCards.length === 0) {
          const jobLinks = $("a[href*='/jobs/']");
          console.log(`🔗 Найдено прямых ссылок: ${jobLinks.length}`);
          jobLinks.each((_, el) => {
            const href = $(el).attr("href");
            if (href) {
              const abs = href.startsWith("http") ? href : `${BASE_URL}${href}`;
              collectedLinks.push(abs);
            }
          });
        } else {
          jobCards.each((_, el) => {
            const linkEl = $(el).find("a[href*='/jobs/']").first();
            const href = linkEl.attr("href");
            if (href) {
              const abs = href.startsWith("http") ? href : `${BASE_URL}${href}`;
              collectedLinks.push(abs);
            }
          });
        }

        console.log(`🔗 Собрано ссылок: ${collectedLinks.length} (страница ${page})`);
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`Ошибка загрузки страницы ${page}:`, error);
        break;
      }
    }

    const uniqueLinks = Array.from(new Set(collectedLinks));
    console.log(`📊 Всего уникальных вакансий: ${uniqueLinks.length}`);

    // Парсим каждую вакансию
    for (const jobUrl of uniqueLinks) {
      try {
        const jobDetail = await fetchJobDetail(jobUrl);
        if (!jobDetail) {
          totalSkipped++;
          continue;
        }

        const { title, company, description, fullDescription } = jobDetail;

        // Извлекаем ID из URL
        const sourceIdMatch = jobUrl.match(/\/jobs\/([^\/?#]+)/i);
        const sourceId = sourceIdMatch ? sourceIdMatch[1] : jobUrl;

        // Определяем удаленную работу
        const isRemote = /удаленн|remote/i.test(description) || /удаленн|remote/i.test(title);

        // Извлекаем навыки
        const skills = extractSkills(title + " " + description);

        // Создаем превью
        const preview = makeShort(description, 500);

        const transformed = {
          externalId: `${SOURCE}:${sourceId}`,
          title,
          company,
          location: "Remote", // По умолчанию, так как большинство удаленные
          url: jobUrl,
          publishedAt: new Date(), // Будет обновлено из списка
          source: SOURCE,
          description: preview,
          fullDescription: fullDescription ? {
            raw: fullDescription,
            preview,
            processed: fullDescription,
            textOnly: description,
          } : undefined,
          skills: skills.length ? skills : ['javascript'],
          isRemote,
          sourceId,
          sourceUrl: jobUrl,
          confidence: 0.9,
          parsedAt: new Date(),
        } as any;

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
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Соединение с MongoDB закрыто");
    }
  }
}

fetchAndSaveFromCareered();
