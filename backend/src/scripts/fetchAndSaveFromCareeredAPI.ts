import mongoose from "../config/database.js";
import dotenv from "dotenv";
import { CareeredClient } from "../utils/http/adapters/CareeredClient.js";
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
    },
    { timestamps: true }
  );

  return mongoose.model("Vacancy", vacancySchema);
}

const SOURCE = "careered.io";
const MAX_PAGES = parseInt(process.env.MAX_PAGES || "5");

function makeShort(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
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

async function fetchAndSaveFromCareeredAPI() {
  console.log("🚀 Запускаю импорт с Careered.io API…");
  const mongoUrl = process.env.MONGO_URI || "mongodb://mongodb:27017/jspulse";

  let connection;
  let careeredClient: CareeredClient | null = null;

  try {
    connection = await mongoose.connect(mongoUrl);
    console.log("✅ MongoDB подключен");

    const Vacancy = await getVacancyModel();

    // Initialize CareeredClient with Playwright mode for API interception
    careeredClient = new CareeredClient({
      logging: true,
      mode: 'playwright'
    });

    let totalReceived = 0;
    let totalNew = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    // Process jobs from API with pagination
    let offset = 0;
    let page = 1;

    while (page <= MAX_PAGES) {
      console.log(`📄 Страница API ${page}/${MAX_PAGES} (offset: ${offset})`);

      try {
        const apiResponse = await careeredClient.getJobListingsFromAPI(offset, 20);

        console.log(`📊 API ответ: ${apiResponse.entries.length} вакансий, всего: ${apiResponse.total}`);

        if (apiResponse.entries.length === 0) {
          console.log("🏁 Похоже, вакансии закончились. Останавливаюсь.");
          break;
        }

        // Convert API jobs to job URLs for processing
        const jobUrls = apiResponse.entries.map(job => `https://careered.io/jobs/${job.id}`);

        // Обрабатываем все вакансии без стратегии раннего выхода
        let newCount = 0;
        let existingCount = 0;

        for (const jobUrl of jobUrls) {
          const jobId = jobUrl.split('/jobs/')[1];

          const existing = await Vacancy.findOne({
            $or: [
              { sourceUrl: jobUrl },
              { externalId: `${SOURCE}:${jobId}` }
            ]
          });

          if (existing) {
            existingCount++;
            console.log(`  ⚪ Существующий элемент пропущен`);
          } else {
            try {
              await processVacancy(jobId, apiResponse.entries);
              newCount++;
            } catch (error) {
              console.error(`❌ Ошибка парсинга вакансии: ${jobId}`, error);
            }
          }
        }

        const result = { newCount, existingCount, totalCount: jobUrls.length };

        totalNew += result.newCount;
        totalUpdated += result.existingCount;
        totalSkipped += result.totalCount - result.newCount - result.existingCount;

        console.log(`📄 Страница ${page} итог: ✨${result.newCount} новых, 🔄${result.existingCount} обновлено, ❌${result.totalCount - result.newCount - result.existingCount} пропущено`);

        // Если все вакансии на странице уже существуют, прекращаем парсинг
        if (result.newCount === 0 && result.existingCount > 0) {
          console.log(`🛑 Остановка парсинга: все вакансии уже существуют`);
          break;
        }

        offset += 20;
        page++;

        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        console.error(`Ошибка загрузки страницы ${page}:`, error);
        break;
      }
    }

    // Функция обработки отдельной вакансии
    async function processVacancy(jobId: string, apiJobs: any[]): Promise<void> {
      try {
        const apiJob = apiJobs.find(job => job.id === jobId);

        if (!apiJob) {
          throw new Error(`API job not found for ID: ${jobId}`);
        }

        // Convert API job to job detail format
        const features = apiJob.features.reduce((acc: any, feature: any) => {
          acc[feature.key] = feature.value;
          return acc;
        }, {});

        const title = features.name || 'Без названия';
        const company = features.company || 'Неизвестная компания';
        const location = features.location || 'Remote';
        const shortDescription = features.summary || '';

        // Get full description from the job page
        let fullDescription = '';
        try {
          fullDescription = await careeredClient!.getFullJobDescription(jobId);
          console.log(`  📄 Получено полное описание для ${jobId} (${fullDescription.length} символов)`);
        } catch (error) {
          console.warn(`  ⚠️ Не удалось получить полное описание для ${jobId}, используем краткое:`, error);
          fullDescription = shortDescription;
        }

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
        const publishedAt = apiJob.posted_at ? new Date(apiJob.posted_at * 1000) : new Date();

        // Извлекаем навыки из полного описания
        const skills = extractSkills(title + " " + fullDescription);

        // Создаем превью из полного описания
        const preview = makeShort(fullDescription, 500);

        // Фильтрация по стоп-словам бэкенда: проверяем ТОЛЬКО заголовок
        if (containsBackendStopWords(title.toLowerCase())) {
          console.log(`  🚫 ПРОПУЩЕНА (стоп-слова): "${title}"`);
          throw new Error('Вакансия содержит стоп-слова');
        }

        // Создаем объект вакансии
        const transformed = {
          externalId: `${SOURCE}:${jobId}`,
          title,
          company,
          location: location || "Remote",
          url: `https://careered.io/jobs/${jobId}`,
          publishedAt,
          source: SOURCE,
          description: preview,
          fullDescription: fullDescription ? {
            raw: fullDescription,
            preview,
            processed: fullDescription,
            textOnly: fullDescription.replace(/<[^>]*>/g, ''), // Remove HTML tags for text-only version
          } : undefined,
          skills: skills.length ? skills : ['javascript'],
          isRemote: location.toLowerCase().includes('remote') || location.toLowerCase().includes('удаленн'),
          sourceId: jobId,
          sourceUrl: `https://careered.io/jobs/${jobId}`,
          confidence: 0.95, // High confidence for API data
          parsedAt: new Date(),
        } as any;

        // Добавляем информацию о зарплате если есть
        if (salary) {
          transformed.salaryFrom = salary.from;
          transformed.salaryTo = salary.to;
          transformed.salaryCurrency = salary.currency;
        }

        // Создаем новую вакансию
        await Vacancy.create(transformed);
        console.log(`  ✨ НОВАЯ: "${title}" (https://careered.io/jobs/${jobId})`);
        totalReceived++;

        // Задержка между обработкой вакансий для снижения нагрузки на сервер
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error("❌ Ошибка парсинга вакансии:", jobId, err);
        throw err;
      }
    }

    console.log("\n🎯 ИТОГ Careered.io API:");
    console.log(`📊 Получено: ${totalReceived}`);
    console.log(`✨ Новых: ${totalNew}`);
    console.log(`🔄 Обновлено: ${totalUpdated}`);
    console.log(`❌ Пропущено: ${totalSkipped}`);
  } catch (error) {
    console.error("❌ Ошибка импорта Careered.io API:", error);
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

fetchAndSaveFromCareeredAPI();
